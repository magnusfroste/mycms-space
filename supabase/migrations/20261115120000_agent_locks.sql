-- Lane locks for agent runs (pattern from FlowPilot): only one heartbeat at a
-- time. A lock expires by itself, so a crashed run never blocks the next one.
create table if not exists public.agent_locks (
  lane text primary key,
  holder text not null,
  expires_at timestamptz not null
);
alter table public.agent_locks enable row level security;
-- No policies: only the service role (edge functions) uses it.

create or replace function public.try_acquire_agent_lock(p_lane text, p_holder text, p_ttl_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare got text;
begin
  insert into agent_locks as l (lane, holder, expires_at)
  values (p_lane, p_holder, now() + make_interval(secs => greatest(p_ttl_seconds, 30)))
  on conflict (lane) do update
    set holder = excluded.holder, expires_at = excluded.expires_at
    where l.expires_at < now()
  returning holder into got;
  return coalesce(got = p_holder, false);
end;
$$;

create or replace function public.release_agent_lock(p_lane text, p_holder text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from agent_locks where lane = p_lane and holder = p_holder;
$$;

revoke all on function public.try_acquire_agent_lock(text, text, integer) from public, anon, authenticated;
revoke all on function public.release_agent_lock(text, text) from public, anon, authenticated;
