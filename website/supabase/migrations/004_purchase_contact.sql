-- Apply after 003. Historical orders remain valid without a contact address.
alter table public.orders add column purchase_email text check (purchase_email is null or length(purchase_email) between 3 and 254);

-- Preserve the existing 4-argument RPC for historical tools; checkout uses this overload.
create function public.reserve_order(p_purchase uuid,p_website text,p_plan text,p_amount integer,p_email text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare o orders; begin
 if p_email is null or length(p_email)>254 or p_email !~ '^[^[:space:]@<>]+@[^[:space:]@<>]+\.[^[:space:]@<>]+$' then raise exception 'INVALID_PURCHASE_EMAIL'; end if;
 select * into o from jsonb_populate_record(null::orders,public.reserve_order(p_purchase,p_website,p_plan,p_amount));
 if o.status<>'created' then return to_jsonb(o); end if;
 if o.purchase_email is not null and o.purchase_email<>lower(trim(p_email)) then raise exception 'PURCHASE_EMAIL_LOCKED'; end if;
 update orders set purchase_email=lower(trim(p_email)) where id=o.id returning * into o;
 return to_jsonb(o);
end $$;
revoke all on function public.reserve_order(uuid,text,text,integer,text) from public,anon,authenticated;
grant execute on function public.reserve_order(uuid,text,text,integer,text) to service_role;
