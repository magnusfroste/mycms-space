# MCP server — operator guide

External agents (Hermes, Claude, ChatGPT, Cursor …) run this CMS through one
MCP endpoint. Visitors' agents can use the same endpoint without a key to read
the public profile and projects.

Source: `supabase/functions/mcp-server/` (`index.ts`, `cms-tools.ts`,
`profile-tools.ts`) and `supabase/functions/_shared/knowledge-tools.ts`.

## Endpoint

```
<SUPABASE_URL>/functions/v1/mcp-server
```

- Transport: streamable HTTP, JSON-RPC 2.0 over `POST` (batches allowed).
- Protocol version reported: `2024-11-05`. Server name: `openclaw-mcp`.
- `GET` on the endpoint returns a small JSON capability description.
- Methods: `initialize`, `ping`, `tools/list`, `tools/call`, `resources/list`,
  `resources/read`, `prompts/list` (empty), notifications.
- Resources: `project://<repo-name>` for every enabled GitHub repo.

The site is a static SPA, so connect to the Supabase URL, not to the site's
domain. (`vercel.json` rewrites `/mcp` to the endpoint, but only on Vercel.)

## Connect an agent

1. Admin → **Agents → Operators & Autopilot** → **Connect an agent**.
2. Name the agent and pick scopes (default: read, content, review).
3. Copy the key. Only a SHA-256 hash is stored, so the key is shown once;
   rotate it if it is lost. Keys can be revoked and rotated from the same list.
4. Paste the generated config into the agent:

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

5. Tell the agent to start with `site_overview`.

Keys are issued only by a signed-in admin (`mcp-keys` function). Creating,
revoking or rotating keys and reading secrets is **not** possible through MCP.

## Scopes

| Scope | Gives |
|---|---|
| `read` | Read everything: site overview, inbox, conversations, analytics, review queue, settings, private knowledge base documents. |
| `content` | Create/update knowledge base, blog drafts, page blocks, projects, newsletter drafts, inbox read state. Public agent skills. |
| `review` | Approve/reject Autopilot work, publish posts, send newsletters. |
| `settings` | Module settings, module on/off, navigation, automations. Internal Autopilot skills. |

Legacy values are still honoured: `tools:call` = all four scopes,
`tools:read` = `read`. A key with no scopes is rejected on `tools/list`.

## Tools

`tools/list` only shows what the key may call. CMS tool descriptions are
prefixed with their scope, e.g. `[content] …`.

### Open to everyone (no key)

| Tool | What it does |
|---|---|
| `get_profile` | Positioning, audience, offering, themes, availability, links. |
| `get_resume` | Profile header + knowledge base as markdown. Anonymous: public documents only; with any key: private documents too. |
| `kb_list`, `kb_get` | Knowledge base documents. Public only, unless the key has `read`. |
| `list_projects`, `get_project`, `search_projects` | Enabled GitHub projects with AI-enriched fields. |
| `analyze_job_fit` | Score a job/assignment against the profile (AI). |
| `generate_tailored_cv` | Match analysis, tailored CV and cover letter in markdown (AI). |
| `contact_magnus` | Leave a message (name + email required); lands in the inbox. |

Anonymous limits are counted from `mcp_activities` and shared by all anonymous
callers: 20 AI calls (`analyze_job_fit` + `generate_tailored_cv`) and 5
`contact_magnus` calls per hour.

### `read`

`site_overview` (start here: north star = inquiries this month, visitors,
chats, review queue, failed runs, stale knowledge base, unread inbox, 404s),
`blog_list`, `blog_get`, `pages_list`, `page_get`, `block_types` (the
supported block types with example configs),
`projects_list`, `inbox_list`, `conversations_list`, `conversation_get`,
`analytics_summary`, `review_queue_list`, `autopilot_status`, `settings_get`,
`modules_list`, `nav_list`, `newsletter_overview`, `media_list`,
`activity_log`.

`settings_get` refuses the secret-holding modules `api_tokens` and
`gmail_signals`.

### `content`

| Tool | Notes |
|---|---|
| `kb_upsert`, `kb_append`, `kb_delete` | Knowledge base writes. Previous version is kept. Public documents refuse email addresses and phone numbers. |
| `blog_upsert` | Creates/updates a post; new posts are always drafts. |
| `page_block_update` | Merge (default) or replace a block's config, or switch it on/off. |
| `page_block_add` | Add a block at a position (0 = top; default last). Enabled unless `enabled: false` is passed. |
| `page_block_move` | Move a block on its page. |
| `page_block_delete` | Delete a block; its last config is kept in the activity log. |
| `project_update` | Enriched title/description, problem, why it matters, featured, visible, order. |
| `inbox_mark` | Mark a contact message read/unread. |
| `newsletter_draft` | Create/update a campaign draft. |

Plus enabled agent skills with scope `public`, `both` or `external`.

### `review`

`review_decide` (approve/reject queue items; approving a blog draft publishes
it, approving a newsletter draft marks it ready), `blog_publish` (publish now,
schedule, or unpublish), `newsletter_send` (requires `confirm: true`;
irreversible).

### `settings`

`settings_update` (merge into a module config), `module_toggle` (blog,
projects, newsletter, ai, github, webhooks, chrome_extension), `nav_update`,
`automation_update`. Plus enabled agent skills with scope `internal`.

Locked even with `settings`: `api_tokens`, `gmail_signals` and `webhooks`
module configs, and the AI provider keys in the `ai` module
(`integration`, `active_integration`, `webhook_url`, `admin_ai_config`,
`admin_ai_provider`). Those are changed by the owner in the admin.

## Editing pages

Pages are ordered lists of blocks stored in `page_blocks`. A typical flow:

1. `pages_list` → `page_get { slug: "home" }`
2. `block_types` for the supported types, with an example config from a live
   block where one exists
3. `page_block_update { id, config: { … } }` (merge) or `page_block_add`
4. Ask the owner to look, or check the live page

Block types the site renders: `chat-hero`, `text-section`, `expertise-grid`,
`github`, `blog`, `cta-banner`, `contact-form`. `page_block_add` refuses
any other type.

## Audit

Every `initialize`, `tools/list` and `tools/call` is logged in
`mcp_activities` (key name, tool, input, output, status, duration). Settings
and block changes made through CMS tools are also written to
`settings_history`. Both show in admin → **Activity log**.
