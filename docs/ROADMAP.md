# Roadmap

Short and honest: what is done, and the follow-ups that are actually open.
The old A2A/federation vision is dropped (see
[ARCHITECTURE.md → What changed / removed](ARCHITECTURE.md#what-changed--removed)).

## Done (autumn 2026)

- **Knowledge base** replaces the structured resume: markdown documents,
  public/private, versioned, `kb_*` tools, PII guard on public documents.
- **MCP parity**: operators run the whole CMS through MCP with scoped keys
  (read, content, review, settings); keys hashed, shown once, logged.
- **Autopilot** (formerly Agency): review queue in one place, guardrails
  (`max_waiting_reviews`, `draft_expiry_days`), one-off cleanup of the old
  queue, Gmail scan stops instead of failing when the grant has expired.
- **Admin redesign**: grouped sidebar, top bar with ⌘K search and Ask Magnet,
  Overview with the north star and funnel, Operators & Autopilot,
  Integrations, Modules, Activity log.
- **Studio theme** and new public pages: landing blocks, contact, blog,
  project case studies, ChatGPT-style `/chat`, 404.
- **Pages as data**: visual page builder removed; block outline + JSON editor
  in the admin; unused block types and `/demo` removed.
- **Security and privacy**: admin-only RLS with explicit public reads; cron
  secret for scheduled functions; per-IP rate limits; one-time OAuth state;
  public chat cannot choose provider or reach admin tools; secret modules,
  `resume_entries`, chat analytics and blocks of unpublished pages are no
  longer public; analytics skill made internal.
- **GitHub sync** fixed (automation pointed at the wrong skill); project
  README images and links point to GitHub.
- **A2A removed**, including the SoundSpace music skill.
- Code cleanup: dead files, one edge function (`firecrawl-scrape`) and unused
  packages removed; route-level code splitting.

## Next

Operations

- Renew `GITHUB_TOKEN` (Supabase secret used by `github-repos`).
- Reconnect Gmail in admin → Integrations; inbox scans are paused until
  then.

Content and site

- Newsletter: visitor sign-ups are stored as `pending` and activated by
  hand. If public sign-up is offered again, add double opt-in (confirmation
  email). The `newsletter-subscribe` block has been removed, so there is
  currently no sign-up form on the site.
- Sitemap on Lovable hosting: `/sitemap.xml` is the static file in `public/`
  (5 URLs). Blog posts and projects are only in the `sitemap-dynamic`
  function (listed in `robots.txt`). Either generate the static file at build
  time or make sure crawlers use the function URL.
- Refresh `public/llms.txt` and `public/mcp.json` (last updated May 2026;
  `mcp.json` still says a key is only needed for skills and does not list
  `kb_list`/`kb_get`).
- The MCP tool descriptions of `generate_tailored_cv` refer to "the CV agent
  on the site"; that block no longer exists.

Code

- `/portfolio` and `/projects` still redirect to `/#project-showcase`. That
  block type is gone and the anchor resolver no longer knows the id, so
  point the redirects at `/#github` or `/github`.
- `@tailwindcss/typography` is installed but not registered in
  `tailwind.config.ts`, so `prose` classes have no effect. Register the
  plugin or drop the classes.
- Consolidate lockfiles: `package-lock.json`, `bun.lock` and `bun.lockb`
  are all committed. Keep one.
- Self-hosting files are out of date (see [DEPLOYMENT.md](../DEPLOYMENT.md#self-hosting)):
  `setup.sh`, `deploy.sh` and `docker-compose.yml` use
  `VITE_SUPABASE_ANON_KEY`, the app reads `VITE_SUPABASE_PUBLISHABLE_KEY`;
  `nginx.conf` uses `${VITE_SUPABASE_URL}`, which nginx does not substitute.
- Consider applying the public-document PII check in the admin knowledge base
  editor too (today only agent writes are checked).
