-- Verified buyer transaction references. Never infer a mapping from email alone.
alter table public.orders add column paypal_payer_email text check(paypal_payer_email is null or length(paypal_payer_email) between 3 and 254);
create index orders_purchase_email_lookup on public.orders(purchase_email) where purchase_email is not null;
create index orders_paypal_email_lookup on public.orders(paypal_payer_email) where paypal_payer_email is not null;
create function public.record_capture(p_order uuid,p_capture text,p_payer text,p_payer_email text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare result jsonb; begin
 result:=public.record_capture(p_order,p_capture,p_payer);
 if result->>'status'='paid' and p_payer_email is not null and length(p_payer_email)<=254 and p_payer_email ~ '^[^[:space:]@<>]+@[^[:space:]@<>]+\.[^[:space:]@<>]+$' then
  update orders set paypal_payer_email=lower(trim(p_payer_email)) where id=p_order and provider_capture_id=p_capture;
 end if;
 return result;
end $$;
revoke all on function public.record_capture(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.record_capture(uuid,text,text,text) to service_role;
create table public.paypal_transaction_aliases (
 transaction_id text primary key check(transaction_id ~ '^[A-Z0-9]{5,64}$'),
 order_id uuid not null references public.orders(id),
 source text not null check(source in ('paypal_reporting','manual_paypal_dashboard')),
 operator_note text not null check(length(operator_note) between 8 and 500),
 created_at timestamptz not null default now()
);
alter table public.paypal_transaction_aliases enable row level security;
revoke all on public.paypal_transaction_aliases from public,anon,authenticated;
grant select on public.paypal_transaction_aliases to service_role;
create function public.record_transaction_alias(p_transaction text,p_order uuid,p_source text,p_note text) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare o orders; existing uuid; begin
 select * into o from orders where id=p_order for update;
 if not found or o.environment<>'sandbox' or o.status<>'paid' then raise exception 'NOT_PAID'; end if;
 if p_transaction=o.provider_capture_id then return true; end if;
 if exists(select 1 from orders where provider_capture_id=p_transaction and id<>p_order) then raise exception 'TRANSACTION_ALIAS_CONFLICT'; end if;
 insert into paypal_transaction_aliases(transaction_id,order_id,source,operator_note) values(p_transaction,p_order,p_source,p_note)
 on conflict(transaction_id) do nothing;
 select order_id into existing from paypal_transaction_aliases where transaction_id=p_transaction;
 if existing<>p_order then raise exception 'TRANSACTION_ALIAS_CONFLICT'; end if;
 return true;
end $$;
revoke all on function public.record_transaction_alias(text,uuid,text,text) from public,anon,authenticated;
grant execute on function public.record_transaction_alias(text,uuid,text,text) to service_role;
