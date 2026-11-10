-- OAuth for MCP: Claude, ChatGPT and other custom connectors sign in with
-- Supabase Auth's OAuth 2.1 server instead of a static API key.
--
-- Supabase issues the tokens; this table holds what each connected client may
-- do in the CMS (the same scopes as API keys: read, content, review,
-- settings). The admin picks them on the consent page (/oauth/consent).
-- Deleting or revoking a row cuts the client off at the MCP server at once.

create table if not exists public.mcp_oauth_grants (
  client_id text primary key,
  client_name text,
  scopes text[] not null default array['read']::text[],
  user_id uuid not null references auth.users (id) on delete cascade,
  revoked boolean not null default false,
  use_count integer not null default 0,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mcp_oauth_grants enable row level security;

drop policy if exists "Admin full access" on public.mcp_oauth_grants;
create policy "Admin full access" on public.mcp_oauth_grants
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- An OAuth access token is a normal Supabase JWT for the admin user, plus a
-- client_id claim. Without this, a connected agent could skip the MCP scopes
-- and use the token directly against the REST API with full admin rights.
-- OAuth tokens therefore never count as admin in RLS; they only work through
-- the MCP server, which checks the grant above.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'client_id', '') = ''
    and exists (select 1 from public.admin_users where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;
