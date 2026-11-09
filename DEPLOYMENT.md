# Deployment

froste.eu runs on **Lovable** with its Supabase backend. The self-hosting
files in the repo are older and need fixes before use (see below).

## Lovable (production)

### Frontend

- The Lovable project is synced with this GitHub repository's `main` branch.
  Merging to `main` updates the Lovable project; publish from Lovable.
- The frontend reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
  (committed in `.env` by Lovable; the publishable key is public by design).

### Edge functions

Edge functions in `supabase/functions/` are **not** deployed by the GitHub
sync. After changing a function (or anything in `supabase/functions/_shared/`,
which every importing function bundles), ask Lovable to deploy the affected
functions by name, e.g. "Deploy the edge functions mcp-server and ai-chat".

`supabase/config.toml` sets `verify_jwt = false` for functions that check
the caller themselves (see [ARCHITECTURE.md → Security model](docs/ARCHITECTURE.md#security-model)).

### Database migrations

Migrations live in `supabase/migrations/`. Several recent ones were applied
in production before they were committed and are written to be idempotent.
Apply new migrations through Lovable (or the Supabase SQL editor), then
regenerate `src/integrations/supabase/types.ts` if the schema changed.

### Scheduled jobs

pg_cron jobs live in the database, not in migrations. They call the
scheduled functions (`magnet-heartbeat`, `agent-autopilot`,
`agent-inbox-scan`, `agent-daily-report`) with an `x-cron-secret` header. The
secret is in `internal_secrets` (created by
`20261017120000_cron_secret.sql`) and must not be committed.

### Admin access

Admins are rows in `admin_users`. The security migration made every account
existing at that time an admin; add new admins by inserting their
`auth.users` id. Signing up alone gives no data access.

### Secrets (Supabase → Edge Functions → Secrets)

| Secret | Used for |
|---|---|
| `OPENAI_API_KEY` | OpenAI provider, text-to-speech, Whisper |
| `GEMINI_API_KEY` | Gemini provider |
| `LOVABLE_API_KEY` | Lovable AI gateway provider |
| `CUSTOM_AI_API_KEY` (or another `*API_KEY`) | Custom OpenAI-compatible endpoint |
| `RESEND_API_KEY`, `FROM_EMAIL`, `ADMIN_EMAIL` | Newsletter, notifications, daily report |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Gmail connection |
| `GITHUB_TOKEN` | GitHub sync (`github-repos`) |
| `FIRECRAWL_API_KEY` | Autopilot research, repo enrichment |
| `UNSPLASH_ACCESS_KEY` | Image search in the admin |
| `APP_URL`, `SITE_URL` | Admin links in notification emails; redirect after Gmail connect |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided by Supabase.

### After deploy

- `GET <SUPABASE_URL>/functions/v1/mcp-server` returns the server
  description.
- Admin → Integrations shows which providers and sources are connected.
- Admin → Operators & Autopilot shows Autopilot health and failed runs.

## Self-hosting

The frontend is a static Vite build (`npm run build` → `dist/`); everything
dynamic runs in Supabase. You need your own Supabase project with the
migrations, edge functions, secrets and cron jobs described above.

Local development:

```bash
npm install
npm run dev        # Vite dev server
npm run build      # production build
npm run lint
```

Files in the repo, and what to know about them:

| File | State |
|---|---|
| `Dockerfile` | Builds with Node 20 and serves `dist/` with nginx. Vite variables are baked in at **build** time; with no `.dockerignore`, the committed `.env` (froste.eu's project) is used unless you replace it. |
| `nginx.conf` | SPA fallback, gzip, caching. The `/api/` block uses `proxy_pass ${VITE_SUPABASE_URL};`, which nginx does not substitute from the environment: remove or hard-code it before building. |
| `docker-compose.yml` | Passes `VITE_SUPABASE_ANON_KEY` at runtime, which neither reaches the built bundle nor matches the name the app reads (`VITE_SUPABASE_PUBLISHABLE_KEY`). Its `supabase` service is not a working Supabase setup; use Supabase Cloud or the official self-hosting guide. |
| `easypanel.json` | Same runtime-variable caveat as docker-compose. |
| `setup.sh`, `deploy.sh` | Interactive helpers. They write `VITE_SUPABASE_ANON_KEY`; rename it to `VITE_SUPABASE_PUBLISHABLE_KEY`. `setup.sh` can deploy all functions and push migrations with the Supabase CLI. |
| `vercel.json` | Rewrites `/mcp`, `/sitemap.xml`, `/blog/:slug` and `/project/:repoName` to Supabase functions (MCP, dynamic sitemap, OG pages) and everything else to `index.html`. The URLs are hard-coded to froste.eu's Supabase project, and these rewrites only apply on Vercel, not on Lovable or Docker. |

## Troubleshooting

- **Function change not live** — it was not deployed; ask Lovable to deploy
  that function.
- **Blank admin views or empty lists** — the signed-in user is not in
  `admin_users`, so RLS returns nothing.
- **Scheduled runs return 403** — the cron job's `x-cron-secret` does not
  match `internal_secrets`.
- **Gmail scans stopped** — the Google grant expired; reconnect in admin →
  Integrations.
- **429 from chat or voice** — per-IP rate limit (see ARCHITECTURE.md).
