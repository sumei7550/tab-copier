-- Apply after 001 and 002. Preserve existing purchases, payments and credentials.
alter table public.purchase_sessions add column ticket_created_at timestamptz;
update public.purchase_sessions set ticket_created_at=created_at where ticket_created_at is null;
alter table public.purchase_sessions alter column ticket_created_at set default now();
alter table public.purchase_sessions alter column ticket_created_at set not null;

create or replace function public.exchange_checkout(p_ticket text,p_website text) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare s purchase_sessions; begin
 select * into s from purchase_sessions where ticket_hash=p_ticket for update;
 if not found or s.ticket_used_at is not null or s.ticket_created_at<now()-interval '10 minutes' or s.expires_at<=now() then raise exception 'UNAUTHORIZED'; end if;
 update purchase_sessions set ticket_used_at=now(),website_hash=p_website where id=s.id;
 return s.id;
end $$;

create function public.resume_checkout(p_purchase uuid,p_poll text,p_ticket text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare s purchase_sessions; o orders; begin
 select * into s from purchase_sessions where id=p_purchase and poll_hash=p_poll for update;
 if not found then raise exception 'UNAUTHORIZED'; end if;
 if s.expires_at<=now() then raise exception 'EXPIRED'; end if;
 select * into o from orders where purchase_id=s.id;
 if found and o.status='paid' then return jsonb_build_object('status','paid'); end if;
 if found and o.status in ('refunded','reversed','review') then raise exception 'REVOKED'; end if;
 update purchase_sessions set ticket_hash=p_ticket,ticket_created_at=now(),ticket_used_at=null where id=s.id;
 return jsonb_build_object('status',coalesce(o.status,'not_created'));
end $$;
revoke all on function public.resume_checkout(uuid,text,text) from public,anon,authenticated;
grant execute on function public.resume_checkout(uuid,text,text) to service_role;

create or replace function public.reserve_order(p_purchase uuid,p_website text,p_plan text,p_amount integer) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare s purchase_sessions; o orders; begin
 select * into s from purchase_sessions where id=p_purchase and website_hash=p_website for update;
 if not found or s.ticket_used_at is null or s.ticket_used_at<now()-interval '24 hours' or s.expires_at<=now() then raise exception 'UNAUTHORIZED'; end if;
 select * into o from orders where purchase_id=s.id;
 if found then
  if o.plan<>p_plan then raise exception 'EXPIRED'; end if;
  return to_jsonb(o);
 end if;
 insert into orders(purchase_id,plan,amount_minor) values(s.id,p_plan,p_amount) returning * into o;
 return to_jsonb(o);
end $$;

