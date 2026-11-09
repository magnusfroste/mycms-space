# Architecture

How the system is built today. For the agent roles see [AGENTS.md](AGENTS.md),
for the MCP tools see [MCP.md](MCP.md).

## Overview

```
 Visitors (browser)           Operators (Hermes, Claude, ChatGPT …)     Owner
        │                                   │                             │
        ▼                                   │ MCP + Bearer key            ▼
 ┌──────────────────────┐                   │                    ┌───────────────┐
 │ React SPA (Vite)     │                   │                    │ /admin (same  │
 │ public site, /chat   │                   │                    │ SPA, Supabase │
 └──────────┬───────────┘                   │                    │ auth)         │
            │ anon key: RLS-limited reads,  │                    └───────┬───────┘
            │ visitor inserts               │                            │ admin JWT
            ▼                               ▼                            ▼
 ┌──────────────────────────────────────────────────────────────────────────────┐
 │ Supabase                                                                     │
 │  Postgres + RLS ── Storage ── Auth ── pg_cron                                │
 │                                                                              │
 │  Edge functions (Deno)                                                       │
 │   ai-chat ............ Magnet (public / admin mode)                          │
 │   mcp-server ......... operators' interface (scoped keys)                    │
 │   magnet-heartbeat ─┐                                                        │
 │   agent-autopilot   ├─ Autopilot loop (cron secret / service role / admin)   │
 │   agent-execute     │                                                        │
 │   agent-inbox-scan ─┘                                                        │
 │   … content helpers, OG pages, sitemap                                       │
 └───────────────┬──────────────────────────────────────────────────────────────┘
                 ▼
  OpenAI · Gemini · Lovable AI gateway · custom OpenAI-compatible · n8n
  GitHub · Gmail · Resend · Firecrawl · Unsplash
```

## Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix),
  TanStack Query, React Router. Route-level code splitting (`src/App.tsx`).
- **Backend:** Supabase (Postgres with RLS, Auth, Storage, Edge Functions on
  Deno, pg_cron).
- **AI providers** (`_shared/ai-agent.ts`): `openai`, `gemini`, `lovable`
  (Lovable AI gateway), `custom` (any OpenAI-compatible endpoint; only env
  vars named `*API_KEY` and not starting with `SUPABASE` may be forwarded),
  `n8n` (webhook).

## Frontend layout

```
src/
  App.tsx              routes
  pages/               Index, DynamicPage, Chat, Contact, BlogArchive, BlogPost,
                       ProjectCaseStudy, Admin, NotFound
  components/
    blocks/            BlockRenderer + one component per block type
    blocks/studio/     studio-theme variants (chat hero, service cards, GitHub, blog)
    studio/            studio header, footer and page layouts
    chat/              chat UI used by /chat and the admin
    admin/             admin shell (shell/nav.ts is the nav source of truth) and views
    ui/                shadcn/ui
  data/                Supabase queries (one file per entity)
  models/              TanStack Query hooks on top of data/
  types/               shared types, block configs, module configs
  integrations/supabase/  generated client and DB types
```

Data flows `data/` → `models/` (hooks, cache keys) → components.

## Public site

| Route | What |
|---|---|
| `/` | Main landing page (the page marked `is_main_landing`, else `home`), rendered from its blocks |
| `/chat` | Full-page Magnet chat (ChatGPT-style, suggestion chips for clients and recruiters) |
| `/contact` | Contact page reusing the contact form block |
| `/blog`, `/blog/:slug` | Blog archive and posts |
| `/project/:repoName` | Case study for a synced GitHub repo |
| `/:slug` | Any enabled page from `pages`, e.g. `/github` |
| `/portfolio`, `/projects` | Legacy redirects to `/#project-showcase` |
| anything else | 404 page (URL kept, `noindex`) |

**Themes** (`modules.branding.module_config.theme`): `elegant`, `grok`,
`sana`, `terminal`, `studio` (code default: `elegant`). froste.eu runs
**studio**; several blocks and
pages have dedicated studio variants. `?theme=<id>` previews a theme for the
browser tab, `?theme=reset` ends the preview. The admin always uses studio.

The recommended home composition is in `docs/redesign/home-composition.json`:
chat-hero, expertise-grid ("How I can help"), github list, blog compact list,
cta-banner.

## Pages and blocks

A page is a row in `pages` plus an ordered list of rows in `page_blocks`
(`block_type`, `block_config` JSON, `order_index`, `enabled`). There is no
visual page builder.

Block types rendered by `src/components/blocks/BlockRenderer.tsx`:

| Type | Use |
|---|---|
| `chat-hero` | Hero with the Magnet chat card |
| `text-section` | Heading + text |
| `expertise-grid` | Service/expertise cards |
| `github` | Synced GitHub projects (grid or list) |
| `blog` | Latest posts |
| `cta-banner` | Call-to-action band |
| `contact-form` | Contact form → `contact_messages` (used by `/contact`) |

Unknown block types render nothing for visitors.

Editing:

- **Operators** use MCP: `page_get`, `block_types`, `page_block_update`,
  `page_block_add` (only the seven types above), `page_block_move`,
  `page_block_delete`.
- **Admin → Pages**: list of pages (create, show/hide), and per page a block
  outline: reorder, show/hide, delete, add (new blocks start hidden), and edit
  a block's config in a JSON editor.

## Admin

`/admin` (Supabase email login). Navigation comes from
`src/components/admin/shell/nav.ts`; old `?tab=` ids are mapped so existing
links keep working. ⌘K opens a jump-to search.

| Group | Views |
|---|---|
| — | **Overview** (north star: inquiries; funnel visitors → chat → inquiry; what needs attention), **Review queue** |
| Agents | **Operators & Autopilot** (MCP keys, Autopilot health and guardrails, automations, skills, objectives, runs, documents, MCP server), **Magnet (public chat)** |
| Content | **Knowledge base**, **Blog**, **Projects**, **Pages**, **Media**, **Newsletter** |
| Audience | **Inbox**, **Conversations**, **Analytics** |
| Platform | **Integrations** (AI models, GitHub, Gmail, Resend, Firecrawl, Unsplash), **Modules**, **Site settings** (navigation, appearance, SEO & AIEO, webhooks, Chrome extension, profile & API tokens), **Activity log** |

**Ask Magnet** in the top bar opens the admin chat. Views of switched-off
modules are hidden from the sidebar.

## Edge functions

All in `supabase/functions/`. Edge functions are not deployed automatically
— see [DEPLOYMENT.md](../DEPLOYMENT.md).

| Function | Caller / auth |
|---|---|
| `ai-chat` | Public (rate limited); admin mode needs `isAdminRequest` |
| `mcp-server` | Public; Bearer MCP key unlocks scoped CMS tools |
| `mcp-keys` | Admin only (`isAdminRequest`) |
| `magnet-heartbeat`, `agent-autopilot`, `agent-execute`, `agent-inbox-scan`, `agent-daily-report` | Trusted callers only (`isTrustedCaller`) |
| `send-newsletter`, `github-repos`, `enrich-github-repo`, `enhance-text`, `enhance-prompt`, `unsplash-search` | Trusted callers only |
| `gmail-oauth-callback` | Admin starts the flow; Google's redirect must carry a one-time `state` issued to that admin |
| `hero-greeting`, `text-to-speech`, `whisper-transcribe`, `parse-document` | Public, rate limited per IP |
| `signal-ingest` | Chrome extension; token from the `api_tokens` module |
| `og-blog`, `og-project`, `sitemap-dynamic` | Public, read-only |

## Data

Main tables:

- Content: `pages`, `page_blocks`, `blog_posts`, `blog_categories`,
  `blog_post_categories`, `github_repos`, `github_repo_images`, `nav_links`,
  `modules` (one row per module, JSON config).
- Knowledge: `knowledge_docs`, `knowledge_doc_versions`; `resume_entries`
  (archive only).
- Audience: `contact_messages`, `chat_messages`, `chat_analytics`,
  `page_views`, `newsletter_subscribers`, `newsletter_campaigns`.
- Agents: `agent_skills`, `agent_automations`, `agent_objectives`,
  `agent_objective_activities`, `agent_tasks`, `agent_activity`,
  `agent_memory`, `mcp_api_keys` (hashes only), `mcp_activities`.
- Platform: `admin_users`, `settings_history`, `oauth_states`,
  `rate_limits`, `internal_secrets`.

Migrations live in `supabase/migrations/`. The pg_cron jobs themselves are
configured in the database (they carry the cron secret), not in migrations.

## Security model

**RLS.** Every table has "Admin full access" for users in `admin_users`
(`is_admin()`). Visitors (anon key) may only:

- read published blog posts, enabled categories, enabled GitHub repos and
  their images, enabled pages and nav links, public knowledge documents;
- read `page_blocks` that are enabled **and** belong to a page that is not
  switched off;
- read `modules`, except `api_tokens` and `gmail_signals`;
- insert chat messages, chat analytics, contact messages, page views and
  newsletter sign-ups (status `pending`; only an admin activates them).

`resume_entries`, chat logs, contact messages, agent data and MCP keys are not
readable by visitors. Storage: site images are public; `cms-files` cannot be
listed anonymously.

Sign-up is open in the login form, so "authenticated" is not a trust
boundary. The admin UI renders for any signed-in user, but data access is
decided by RLS and the edge functions.

**Edge functions** use the service role and do their own checks
(`_shared/cron-auth.ts`):

- `isTrustedCaller`: pg_cron with a valid `x-cron-secret`, the service role
  key, or a signed-in admin.
- `isAdminRequest`: a signed-in admin only.

**Rate limits** (`_shared/rate-limit.ts`, fixed window in `rate_limits`,
fails open): `ai-chat` 30, `text-to-speech` 30, `whisper-transcribe` 30,
`hero-greeting` 20, `parse-document` 20 requests per 10 minutes per IP.
Anonymous MCP: 20 AI calls and 5 contact messages per hour in total.

**Public chat.** `ai-chat` ignores the provider, model and system prompt sent
by visitors and loads them from the `ai` module; only an admin request may
choose. Public conversations are trimmed to 40 messages × 8000 characters,
and the server only executes tools it offered in that mode.

**MCP.** Keys are stored as SHA-256 hashes, scoped, revocable and logged.
Secret modules, provider settings and key management are out of reach.

## What changed / removed

- **A2A and federation** removed, including the SoundSpace music skill. MCP is
  the only interface for external agents.
- **Visual page builder** removed. Blocks are data, edited through MCP or the
  admin outline/JSON editor. Eighteen unused block types and the `/demo` page
  were removed; seven block types remain.
- **Structured resume UI** removed. The knowledge base replaced it;
  `resume_entries` is kept as a private archive. The unpublished `/resume`
  page was deleted.
- **`firecrawl-scrape` function** removed (Autopilot calls Firecrawl
  directly).
- **"Agency"** is now **Autopilot**; old `?tab=agency` links still resolve.
