-- MCP-paritet: externa agenter (operatörer) styr CMS:et via MCP.
--
-- Blogginlägg kan arkiveras (avvisade Autopilot-utkast, städning av kön).
--
-- Nyckelbehörigheter (read, content, review, settings) kräver ingen
-- schemaändring: mcp_api_keys.scopes är redan en textarray. Servern tolkar
-- de gamla värdena (tools:call = alla fyra, tools:read = read), så befintliga
-- nycklar som hermes fortsätter fungera före och efter deploy.

alter table public.blog_posts drop constraint if exists blog_posts_status_check;
alter table public.blog_posts add constraint blog_posts_status_check
  check (status in ('draft', 'published', 'scheduled', 'archived'));
