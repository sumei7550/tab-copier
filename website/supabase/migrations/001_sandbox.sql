-- Run in a separate Supabase SANDBOX project, never over a production schema.
create extension if not exists pgcrypto;
create table public.purchase_sessions (
 id uuid primary key default gen_random_uuid(), installation_id uuid not null,
 poll_hash text unique not null, ticket_hash text unique not null,
 ticket_used_at timestamptz, website_hash text unique,
 created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '90 days'
);
create table public.orders (
 id uuid primary key default gen_random_uuid(), purchase_id uuid unique not null references public.purchase_sessions,
 plan text not null check(plan in ('trial','month','lifetime')),
 amount_minor integer not null, currency text not null default 'USD' check(currency='USD'),
 environment text not null default 'sandbox' check(environment='sandbox'),
 provider_order_id text unique, provider_capture_id text unique, payer_ref text,
 status text not null default 'created' check(status in ('created','paid','refunded','reversed','review')),
 created_at timestamptz not null default now(), paid_at timestamptz,
 check((plan='trial' and amount_minor=99) or (plan='month' and amount_minor=499) or (plan='lifetime' and amount_minor=1200))
);
create table public.licenses (
 id uuid primary key default gen_random_uuid(), order_id uuid unique not null references public.orders,
 first_activated_at timestamptz, expires_at timestamptz, revoked_at timestamptz
);
create table public.activations (
 id uuid primary key default gen_random_uuid(), license_id uuid not null references public.licenses,
 installation_id uuid not null, refresh_hash text unique not null,
 created_at timestamptz not null default now(), revoked_at timestamptz,
 unique(license_id,installation_id)
);
create unique index one_active_device on public.activations(license_id) where revoked_at is null;
create table public.payment_events (
 id text primary key, event_type text not null, received_at timestamptz not null default now(), processed_at timestamptz
);
create table public.rate_buckets (key text primary key, bucket timestamptz not null, hits integer not null);
create table public.trial_payers (payer_ref text primary key, order_id uuid unique not null references public.orders);

-- Private tables: browsers and anonymous clients cannot access business records.
do $$ declare t text; begin
 foreach t in array array['purchase_sessions','orders','licenses','activations','payment_events','rate_buckets','trial_payers'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on table public.%I from anon, authenticated',t);
 end loop;
end $$;

create function public.consume_rate(p_key text,p_limit integer) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare n integer; begin
 insert into rate_buckets values(p_key,date_trunc('minute',now()),1)
 on conflict(key) do update set bucket=date_trunc('minute',now()),
 hits=case when rate_buckets.bucket=date_trunc('minute',now()) then rate_buckets.hits+1 else 1 end returning hits into n;
 return n<=p_limit;
end $$;

create function public.exchange_checkout(p_ticket text,p_website text) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare s purchase_sessions; begin
 select * into s from purchase_sessions where ticket_hash=p_ticket for update;
 if not found or s.ticket_used_at is not null or s.created_at<now()-interval '10 minutes' then raise exception 'UNAUTHORIZED'; end if;
 update purchase_sessions set ticket_used_at=now(),website_hash=p_website where id=s.id;
 return s.id;
end $$;

create function public.reserve_order(p_purchase uuid,p_website text,p_plan text,p_amount integer) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare s purchase_sessions; o orders; begin
 select * into s from purchase_sessions where id=p_purchase and website_hash=p_website for update;
 if not found or s.created_at<now()-interval '24 hours' then raise exception 'UNAUTHORIZED'; end if;
 select * into o from orders where purchase_id=s.id;
 if found then
  if o.plan<>p_plan then raise exception 'EXPIRED'; end if;
  return to_jsonb(o);
 end if;
 insert into orders(purchase_id,plan,amount_minor) values(s.id,p_plan,p_amount) returning * into o;
 return to_jsonb(o);
end $$;

create function public.record_capture(p_order uuid,p_capture text,p_payer text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare o orders; begin
 select * into o from orders where id=p_order for update;
 if not found or o.status in ('refunded','reversed','review') then raise exception 'REVOKED'; end if;
 if o.status='paid' then
  if o.provider_capture_id<>p_capture then raise exception 'REVOKED'; end if;
  return jsonb_build_object('status','paid');
 end if;
 if o.plan='trial' then
  if p_payer is null then update orders set status='review',provider_capture_id=p_capture where id=o.id; return jsonb_build_object('status','review'); end if;
  insert into trial_payers values(p_payer,o.id) on conflict(payer_ref) do nothing;
  if not exists(select 1 from trial_payers where payer_ref=p_payer and order_id=o.id) then
   update orders set status='review',provider_capture_id=p_capture where id=o.id;
   return jsonb_build_object('status','review');
  end if;
 end if;
 update orders set status='paid',paid_at=now(),provider_capture_id=p_capture,payer_ref=p_payer where id=o.id;
 insert into licenses(order_id) values(o.id) on conflict(order_id) do nothing;
 return jsonb_build_object('status','paid');
end $$;

create function public.activate_purchase(p_purchase uuid,p_poll text,p_installation uuid,p_refresh text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare s purchase_sessions; o orders; l licenses; a activations; begin
 select * into s from purchase_sessions where id=p_purchase and poll_hash=p_poll for update;
 if not found or s.installation_id<>p_installation then raise exception 'UNAUTHORIZED'; end if;
 if s.expires_at<now() then raise exception 'EXPIRED'; end if;
 select * into o from orders where purchase_id=s.id;
 if not found or o.status<>'paid' then raise exception 'NOT_PAID'; end if;
 select * into l from licenses where order_id=o.id for update;
 if not found or l.revoked_at is not null then raise exception 'REVOKED'; end if;
 if l.first_activated_at is null then
  update licenses set first_activated_at=now(),expires_at=case o.plan when 'trial' then now()+interval '72 hours' when 'month' then now()+interval '30 days' else null end
  where id=l.id returning * into l;
  update purchase_sessions set expires_at=now()+interval '7 days' where id=s.id;
 end if;
 if l.expires_at is not null and l.expires_at<=now() then raise exception 'EXPIRED'; end if;
 select * into a from activations where license_id=l.id and installation_id=p_installation;
 if found then
  if a.revoked_at is not null or a.refresh_hash<>p_refresh then raise exception 'REVOKED'; end if;
 else
  if exists(select 1 from activations where license_id=l.id and revoked_at is null) then raise exception 'DEVICE_LIMIT'; end if;
  insert into activations(license_id,installation_id,refresh_hash) values(l.id,p_installation,p_refresh) returning * into a;
 end if;
 return jsonb_build_object('activation_id',a.id,'license_id',l.id,'expires_at',l.expires_at,'plan',o.plan);
end $$;

create function public.refresh_activation(p_refresh text,p_installation uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare a activations; l licenses; o orders; begin
 select * into a from activations where refresh_hash=p_refresh and installation_id=p_installation;
 if not found then raise exception 'UNAUTHORIZED'; end if;
 select * into l from licenses where id=a.license_id;
 select * into o from orders where id=l.order_id;
 if a.revoked_at is not null or l.revoked_at is not null or o.status<>'paid' then raise exception 'REVOKED'; end if;
 if l.expires_at is not null and l.expires_at<=now() then raise exception 'EXPIRED'; end if;
 return jsonb_build_object('activation_id',a.id,'license_id',l.id,'expires_at',l.expires_at,'plan',o.plan);
end $$;

-- Revoke by provider order, not just capture id: catches refund racing capture persistence.
create function public.revoke_order(p_provider_order text,p_state text) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare o orders; begin
 if p_state not in ('refunded','reversed','review') then raise exception 'REVOKED'; end if;
 select * into o from orders where provider_order_id=p_provider_order for update;
 if not found then return false; end if;
 update orders set status=p_state where id=o.id;
 update licenses set revoked_at=coalesce(revoked_at,now()) where order_id=o.id;
 update activations set revoked_at=coalesce(revoked_at,now()) where license_id in(select id from licenses where order_id=o.id);
 return true;
end $$;

do $$ declare r record; begin
 for r in select p.oid::regprocedure sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname in ('consume_rate','exchange_checkout','reserve_order','record_capture','activate_purchase','refresh_activation','revoke_order') loop
  execute format('revoke all on function %s from public, anon, authenticated',r.sig);
  execute format('grant execute on function %s to service_role',r.sig);
 end loop;
end $$;
