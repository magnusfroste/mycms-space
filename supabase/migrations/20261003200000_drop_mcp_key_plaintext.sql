-- MCP keys are stored only as SHA-256 hashes. The plaintext copy (shown in the
-- admin panel) is removed; keys are now shown once at creation/rotation.
-- The anonymous SELECT policy that exposed this table was dropped on 2026-10-03.
drop policy if exists "Service can read MCP keys" on public.mcp_api_keys;
alter table public.mcp_api_keys drop column if exists key_plaintext;
