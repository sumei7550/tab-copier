-- Sandbox-only manual support workflow. Apply after 001_sandbox.sql.
create table public.recovery_sessions (
 id uuid primary key default gen_random_uuid(), installation_id uuid not null,
 secret_hash text unique not null, created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '7 days'
);
create table public.recovery_tokens (
 id uuid primary key default gen_random_uuid(), session_id uuid not null references public.recovery_sessions,
 license_id uuid not null references public.licenses, ticket_hash text unique not null,
 issued_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '24 hours',
 confirmed_at timestamptz, consumed_at timestamptz, superseded_at timestamptz,
 operator_note text not null check(length(operator_note) between 1 and 500)
);
create unique index one_pending_recovery on public.recovery_tokens(session_id) where consumed_at is null and superseded_at is null;
alter table public.recovery_sessions enable row level security;
alter table public.recovery_tokens enable row level security;
revoke all on public.recovery_sessions, public.recovery_tokens from anon,authenticated;

-- Privileged operator RPC; there is deliberately no public HTTP issuance route.
create function public.issue_recovery(p_session uuid,p_order uuid,p_ticket text,p_note text) returns timestamptz
language plpgsql security definer set search_path=public,pg_temp as $$
declare s recovery_sessions; o orders; l licenses; until_at timestamptz; begin
 select * into s from recovery_sessions where id=p_session for update;
 if not found or s.expires_at<=now() then raise exception 'EXPIRED'; end if;
 select * into o from orders where id=p_order for update;
 if not found or o.status<>'paid' then raise exception 'NOT_PAID'; end if;
 select * into l from licenses where order_id=o.id for update;
 if not found or l.revoked_at is not null then raise exception 'REVOKED'; end if;
 if l.expires_at is not null and l.expires_at<=now() then raise exception 'EXPIRED'; end if;
 if exists(select 1 from recovery_tokens where session_id=s.id and consumed_at is not null) then raise exception 'RECOVERY_USED'; end if;
 update recovery_tokens set superseded_at=now() where session_id=s.id and consumed_at is null and superseded_at is null;
 until_at:=least(now()+interval '24 hours',s.expires_at);
 insert into recovery_tokens(session_id,license_id,ticket_hash,expires_at,operator_note) values(s.id,l.id,p_ticket,until_at,p_note);
 return until_at;
end $$;

-- Called only after the user presses Confirm in the emailed-link page. GET never consumes it.
create function public.confirm_recovery(p_ticket text) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare t recovery_tokens; begin
 select * into t from recovery_tokens where ticket_hash=p_ticket for update;
 if not found then raise exception 'UNAUTHORIZED'; end if;
 if t.expires_at<=now() or t.superseded_at is not null then raise exception 'EXPIRED'; end if;
 if t.consumed_at is not null then raise exception 'RECOVERY_USED'; end if;
 update recovery_tokens set confirmed_at=coalesce(confirmed_at,now()) where id=t.id;
 return true;
end $$;

create function public.redeem_recovery(p_session uuid,p_secret text,p_installation uuid,p_refresh text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare s recovery_sessions; t recovery_tokens; l licenses; o orders; a activations; begin
 select * into s from recovery_sessions where id=p_session and secret_hash=p_secret for update;
 if not found or s.installation_id<>p_installation then raise exception 'UNAUTHORIZED'; end if;
 if s.expires_at<=now() then raise exception 'EXPIRED'; end if;
 select * into t from recovery_tokens where session_id=s.id and superseded_at is null order by issued_at desc limit 1 for update;
 if not found or t.confirmed_at is null then raise exception 'RECOVERY_PENDING'; end if;
 -- Short retry window recovers a lost response; it never extends the license.
 if (t.consumed_at is null and t.expires_at<=now()) or (t.consumed_at is not null and t.consumed_at<now()-interval '1 hour') then raise exception 'EXPIRED'; end if;
 select * into l from licenses where id=t.license_id for update;
 select * into o from orders where id=l.order_id;
 if l.revoked_at is not null or o.status<>'paid' then raise exception 'REVOKED'; end if;
 if l.expires_at is not null and l.expires_at<=now() then raise exception 'EXPIRED'; end if;
 if t.consumed_at is not null then
  select * into a from activations where license_id=l.id and installation_id=s.installation_id and revoked_at is null and refresh_hash=p_refresh;
  if not found then raise exception 'REVOKED'; end if;
 else
  if l.first_activated_at is null then
   update licenses set first_activated_at=now(),expires_at=case o.plan when 'trial' then now()+interval '72 hours' when 'month' then now()+interval '30 days' else null end where id=l.id returning * into l;
  end if;
  update activations set revoked_at=coalesce(revoked_at,now()) where license_id=l.id;
  insert into activations(license_id,installation_id,refresh_hash) values(l.id,s.installation_id,p_refresh)
  on conflict(license_id,installation_id) do update set refresh_hash=excluded.refresh_hash,revoked_at=null
  returning * into a;
  update recovery_tokens set consumed_at=now() where id=t.id;
 end if;
 return jsonb_build_object('activation_id',a.id,'license_id',l.id,'expires_at',l.expires_at,'plan',o.plan);
end $$;

revoke all on function public.issue_recovery(uuid,uuid,text,text),public.confirm_recovery(text),public.redeem_recovery(uuid,text,uuid,text) from public,anon,authenticated;
grant execute on function public.issue_recovery(uuid,uuid,text,text),public.confirm_recovery(text),public.redeem_recovery(uuid,text,uuid,text) to service_role;
