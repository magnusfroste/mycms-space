# Agents: Operator, Autopilot, Magnet

Three roles work on the site. They share the same data (Supabase) but have
different powers.

| Role | Who | Talks to | Can publish? |
|---|---|---|---|
| **Operator** | External agents (Hermes, Claude, ChatGPT …) with an MCP key, or the owner in the admin | MCP server / admin UI | Yes, with the `review` scope (or as owner) |
| **Autopilot** | The internal loop (edge functions on a schedule) | The review queue | No — it proposes, an operator decides |
| **Magnet** | The public AI chat on the site | Visitors | No — read-only towards the CMS |

## Operator

Operators steer the CMS. An external agent connects to the MCP server with
its own key and gets tools according to the key's scopes (`read`, `content`,
`review`, `settings`). The owner does the same things in `/admin`. Managing
keys and secrets is admin-only.

See [MCP.md](MCP.md) for the endpoint, scopes and tool list.

Admin: **Agents → Operators & Autopilot** lists operators with their scopes,
last call and calls in the last 30 days, and creates, rotates and revokes
keys. **Activity log → Operators (MCP)** shows every call.

## Autopilot

Autopilot keeps things moving between operator visits. It never publishes on
its own: drafts go into the **review queue** (`agent_tasks` with status
`needs_review`) and wait for an operator.

Building blocks (all in Supabase, editable in the admin and via MCP
`settings`):

- **Skills** (`agent_skills`) — named tools with a JSON tool definition, a
  handler and a scope (`public`, `both`, `external`, `internal`). Skills
  marked `requires_approval` wait for permission in the review queue.
- **Automations** (`agent_automations`) — run a skill on a trigger (cron
  schedule, event or signal). Health, last run and errors are shown in the
  admin.
- **Objectives** (`agent_objectives`) — goals with progress that the loop
  works towards.
- **Memory** (`agent_memory`) — notes the agent keeps between runs.

Edge functions:

| Function | Role |
|---|---|
| `magnet-heartbeat` | The scheduled loop: reflect → signals → objectives → automations → act → heal → remember. Runs due automations through `agent-execute`. |
| `agent-execute` | Runs one skill (edge, module or db handler) and logs it in `agent_activity`. |
| `agent-autopilot` | Research, blog drafts, newsletter drafts, source scouting, multichannel drafts. Uses Firecrawl for web research. |
| `agent-inbox-scan` | Reads Gmail, extracts signals with AI. Stops (instead of failing daily) when the Google grant has expired, until the owner reconnects. |
| `agent-daily-report` | Emails a summary of the last 24 hours. |

All of these only accept trusted callers: pg_cron with the `x-cron-secret`
header, another function with the service role key, or a signed-in admin
(`_shared/cron-auth.ts`).

### Guardrails

Stored in the `autopilot` module config, changeable with `settings_update`
(`agent-autopilot/guardrails.ts`):

- `max_waiting_reviews` (default 5, range 1–50): while this many items wait
  for review, no new drafts are made.
- `draft_expiry_days` (default 14, range 1–90): older unreviewed drafts
  expire. Blog posts get status `archived`; newsletter drafts are copied into
  the task log before the unsent campaign is removed.

- `auto_publish` (default `false`) and `auto_publish_min_score` (default 8,
  range 7–10): a blog draft that passes every mechanical check (sources,
  length, no invented links, title rules) and scores at least the minimum in
  the self-review is published directly. The task is logged as `completed`
  with `decision: auto_published`. Lower scores go to the review queue as
  before. Admin → Agents → Autopilot → Guardrails has the switch.

The guardrails apply to the drafting actions `blog_draft`,
`newsletter_draft` and `multichannel_draft`.

### Blog pipeline

`blog_draft` (cron `autopilot-daily-blog-draft`, Mondays 07:30 UTC) runs
`agent-autopilot/editor.ts`: profile brief → topic from the week's news →
research (broadened once with the topic and thesis when fewer than 3 sources
are found) → writing → mechanical checks → self-review, one revision → review
queue or, with `auto_publish`, published.

### Review queue

Admin → **Review queue** (badge with the waiting count). Approving a blog
draft publishes the post; rejecting archives it. Approving a newsletter draft
marks it ready; it is sent separately. Operators do the same with
`review_queue_list` and `review_decide`.

## Magnet

Magnet is the AI twin on the public site: the chat card in the `chat-hero`
block and the full-page chat at `/chat`. Its job is the north star: help
clients and recruiters understand what Magnus does and get in touch.

- **Grounding:** the profile header (owner name, title, summary, location,
  availability from the `resume` module) plus the **public** knowledge base
  documents, plus the agent's `soul` memory. Private documents are never
  loaded for visitors.
- **Tools:** enabled skills with scope `public` or `both` (for example
  tailored CV, project deep dive, availability check). The server only runs
  tools it offered in that mode.
- **Provider:** for visitors, provider, model and system prompt are always
  read from the `ai` module on the server; what the browser sends is ignored.
  Public requests are rate limited (30 per 10 minutes per IP) and capped at
  the last 40 messages of 8000 characters each.

Admin mode (**Ask Magnet** in the admin top bar, `ai-chat` with
`mode: "admin"`) requires a signed-in admin. It adds private knowledge, the
knowledge base write tools, memory, skill/objective/automation tools and site
stats.

Settings: admin → **Agents → Magnet (public chat)** (model, prompt, tools).

## Knowledge base

The profile is a set of markdown documents (`knowledge_docs`), one area per
document (roles, assignments, projects …).

- Each document is `public` or `private`. New documents default to private.
- Every update and delete keeps the previous version
  (`knowledge_doc_versions`); the admin editor can load an old version.
- Agent writes (`kb_upsert`, `kb_append` via MCP or admin Magnet) to a public
  document are refused if they contain an email address or a phone number.
  The admin editor itself does not run this check.
- Visitors can read public documents only (RLS). Magnet, `get_resume` and the
  anonymous `kb_*` tools use public documents only.

The old `resume_entries` table is kept as an archive. It is not publicly
readable and is used only as a fallback by the server when the knowledge base
has no documents at all.
