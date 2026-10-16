-- Schemalagda agentfunktioner (agent-autopilot, agent-inbox-scan,
-- magnet-heartbeat, agent-daily-report) kontrollerade inte anroparen; cron-
-- jobben skickade bara den publika nyckeln, så vem som helst kunde starta
-- AI-körningar och utskick. Nu skickar cron en hemlig x-cron-secret som
-- funktionerna verifierar via is_valid_cron_secret (endast service_role).
-- Själva cron-jobben uppdaterades direkt i databasen (cron.alter_job) med
-- hemligheten, som inte ska ligga i repot.
create table if not exists public.internal_secrets (name text primary key, value text not null, created_at timestamptz not null default now());
alter table public.internal_secrets enable row level security;
revoke all on public.internal_secrets from anon, authenticated;
insert into public.internal_secrets(name, value) values ('cron_secret', encode(extensions.gen_random_bytes(32), 'hex')) on conflict (name) do nothing;

create or replace function public.is_valid_cron_secret(p_secret text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.internal_secrets where name = 'cron_secret' and value = p_secret and coalesce(p_secret,'') <> '')
$$;
revoke execute on function public.is_valid_cron_secret(text) from public, anon, authenticated;
grant execute on function public.is_valid_cron_secret(text) to service_role;
