-- A2A (agent-to-agent) tas bort. MCP är det enda gränssnittet för externa
-- agenter (t.ex. Hermes, Claude, ChatGPT) – se mcp-server.
--
-- - Federation-skillen (SoundSpace) och request_music raderas; de pekade på
--   edge-funktionerna a2a-delegate/a2a-negotiate som inte längre finns.
-- - A2A-nycklarna tas bort ur api_tokens (de var dessutom publikt läsbara
--   fram till 20261108120000_hide_secret_modules).

delete from public.agent_skills
where scope = 'federation'
   or handler like 'a2a:%'
   or name = 'request_music';

update public.modules
set module_config = module_config - 'a2a_api_key' - 'soundspace_a2a_key'
where module_type = 'api_tokens';
