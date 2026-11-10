# mycms — personal CMS for froste.eu

The site and back office of **Magnus Froste**, consultant, at
[www.froste.eu](https://www.froste.eu).

**North star:** clients and recruiters find Magnus and get in touch.
Everything here — the landing page, the AI chat, the knowledge base, the
agents — exists to turn visits into inquiries.

## How it works

Three agent roles share one Supabase backend:

| Role | What it does |
|---|---|
| **Operator** | External agents (Hermes, Claude, ChatGPT …) — or Magnus in the admin — run the CMS through the **MCP server** with scoped API keys: `read`, `content`, `review`, `settings`. Keys and secrets are admin-only. |
| **Autopilot** | The internal loop: skills, automations and objectives. It researches and drafts, but only **proposes** into a review queue — it never publishes on its own. Guardrails cap the queue (`max_waiting_reviews`) and expire old drafts (`draft_expiry_days`). |
| **Magnet** | The public AI chat. Grounded in the profile header and the **public** knowledge base documents; read-only towards the CMS. |

The profile lives in a **knowledge base**: markdown documents, public or
private, versioned, editable through `kb_*` tools. Public documents refuse
email addresses and phone numbers on agent writes.

Pages are **ordered blocks stored as data**. There is no visual page
builder: operators edit blocks through MCP, and the admin has a block outline
with a JSON editor. Block types: `chat-hero`, `text-section`,
`expertise-grid`, `github`, `blog`, `cta-banner`, `contact-form`.

More: [docs/AGENTS.md](docs/AGENTS.md) · [docs/MCP.md](docs/MCP.md) ·
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Public site

Studio theme. Routes:

- `/` — landing page from blocks (chat hero, how I can help, projects, blog,
  call to action)
- `/chat` — full-page chat with Magnet
- `/contact` — contact form
- `/blog`, `/blog/:slug` — blog
- `/project/:repoName` — project case study from a synced GitHub repo
- `/:slug` — other CMS pages, e.g. `/github`
- everything else — 404

## Admin (`/admin`)

| Group | Views |
|---|---|
| — | Overview (north star, funnel, needs attention) · Review queue |
| Agents | Operators & Autopilot · Magnet (public chat) |
| Content | Knowledge base · Blog · Projects · Pages · Media · Newsletter |
| Audience | Inbox · Conversations · Analytics |
| Platform | Integrations · Modules · Site settings · Activity log |

Plus **Ask Magnet** (admin chat) and ⌘K search in the top bar.

## MCP quick start (operators)

1. Endpoint: `<SUPABASE_URL>/functions/v1/mcp-server` (streamable HTTP,
   JSON-RPC). The admin sidebar shows it with a copy button.
2. Create a key: admin → **Operators & Autopilot** → **Connect an agent**.
   Pick scopes; the key is shown once.
3. Add to the agent's MCP config:

   ```json
   {
     "mcpServers": {
       "mycms": {
         "url": "<SUPABASE_URL>/functions/v1/mcp-server",
         "headers": { "Authorization": "Bearer <YOUR_MCP_KEY>" }
       }
     }
   }
   ```

4. Start with the `site_overview` tool.

Claude, ChatGPT and other custom connectors that sign in instead of using a
key: add `<SUPABASE_URL>/functions/v1/mcp-server/oauth` and approve the
connection on the site. See [OAuth](docs/MCP.md#oauth-custom-connectors).

Tools by scope:

| Scope | Tools |
|---|---|
| none (anonymous) | `get_profile`, `get_resume`, `kb_list`, `kb_get`, `list_projects`, `get_project`, `search_projects`, `analyze_job_fit`, `generate_tailored_cv`, `contact_owner` |
| `read` | `site_overview`, `blog_list`, `blog_get`, `pages_list`, `page_get`, `block_types`, `projects_list`, `inbox_list`, `conversations_list`, `conversation_get`, `analytics_summary`, `review_queue_list`, `autopilot_status`, `settings_get`, `modules_list`, `nav_list`, `newsletter_overview`, `media_list`, `activity_log` (+ private knowledge base documents) |
| `content` | `kb_upsert`, `kb_append`, `kb_delete`, `blog_upsert`, `page_block_update`, `page_block_add`, `page_block_move`, `page_block_delete`, `project_update`, `inbox_mark`, `newsletter_draft` (+ public agent skills) |
| `review` | `review_decide`, `blog_publish`, `newsletter_send` |
| `settings` | `settings_update`, `module_toggle`, `nav_update`, `automation_update` (+ internal agent skills) |

Legacy key scopes still work: `tools:call` = all, `tools:read` = `read`.
Details in [docs/MCP.md](docs/MCP.md).

## Tech stack

- React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · TanStack Query
- Supabase: Postgres with RLS, Auth, Storage, Edge Functions (Deno), pg_cron
- AI: OpenAI, Gemini, Lovable AI gateway, any OpenAI-compatible endpoint, or
  an n8n webhook — chosen in the admin
- Integrations: GitHub, Gmail, Resend, Firecrawl, Unsplash, a Chrome
  extension for signals

## Development

```bash
npm install
npm run dev       # local dev server
npm run build     # production build to dist/
npm run lint
```

The app needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
(in `.env`). There is no test suite.

## Deployment

Production runs on Lovable, synced with `main` on GitHub. Edge functions are
**not** deployed by the sync — ask Lovable to deploy changed functions.
Migrations are in `supabase/migrations/`. See [DEPLOYMENT.md](DEPLOYMENT.md),
including the state of the self-hosting files.

## Security in short

- Visitors can only read published, public content (blocks only on
  published pages); everything else is admin-only through RLS.
- Scheduled and agent functions accept only pg_cron (cron secret), the
  service role or a signed-in admin.
- Public AI endpoints are rate limited per IP; the public chat ignores any
  provider or prompt sent by the browser.
- MCP keys are hashed, scoped, revocable and every call is logged.

## Repository layout

```
src/                     React app (pages, components, data → models → views)
supabase/functions/      edge functions (mcp-server, ai-chat, agent-*, …)
supabase/migrations/     database schema and policies
public/                  llms.txt, mcp.json, robots.txt, sitemap.xml
chrome-extension/        signal capture extension
docs/                    PRD, architecture, agents, MCP, roadmap, redesign sketches
```

## Docs

- [docs/PRD.md](docs/PRD.md) — purpose, users, scope, non-goals
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system, data, security, what was removed
- [docs/AGENTS.md](docs/AGENTS.md) — Operator, Autopilot, Magnet, knowledge base
- [docs/MCP.md](docs/MCP.md) — operator guide for the MCP server
- [docs/ROADMAP.md](docs/ROADMAP.md) — done and next
- [DEPLOYMENT.md](DEPLOYMENT.md) — Lovable, secrets, self-hosting
