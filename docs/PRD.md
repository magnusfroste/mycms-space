# Product requirements

## Purpose

A personal CMS for **froste.eu**, the site of Magnus Froste, consultant.

**North star:** clients and recruiters find Magnus and get in touch.
Measured as inquiries per month (contact messages), shown first in the admin
Overview and in the MCP tool `site_overview`.

## Users

| User | Needs |
|---|---|
| **Visitor** — potential client or recruiter | Understand quickly what Magnus does, see proof (projects, writing), check availability and fit, and make contact. |
| **Visitor's agent** — an AI assistant researching Magnus | Read the public profile and projects in a structured way, check job fit, leave a message (open MCP tools, `llms.txt`). |
| **Operator** — Magnus or an external agent acting for him | Keep content current and decide on proposals, without having to live in an admin UI. |

## Principles

1. **Agents operate, the owner decides.** External agents can do almost
   everything in the CMS through MCP, limited by key scopes. Keys and secrets
   stay with the owner.
2. **Autopilot proposes, never publishes.** Internal automation fills a review
   queue that is capped and expires.
3. **One source for the profile.** The knowledge base (markdown documents,
   public or private) grounds the chat, the MCP profile tools and the CV
   tools.
4. **Private by default.** Visitors and anonymous agents see only published,
   public content. Personal data stays out of public documents.
5. **Content is data.** Pages are ordered blocks in the database; there is no
   visual builder.

## Scope

### Public site

- Landing page built from blocks: chat hero with Magnet, how-I-can-help
  cards, projects, latest posts, call to action.
- `/chat` — full-page conversation with Magnet with starting suggestions.
- `/contact` — contact form; messages land in the admin inbox.
- `/blog` and posts; `/project/:repo` case studies from GitHub repos
  enriched by AI; other CMS pages by slug (e.g. `/github`).
- SEO: per-page meta, OG pages for posts and projects, dynamic sitemap,
  `llms.txt`, `mcp.json`.
- Visitor analytics (page views, chat sessions) and optional Google
  Analytics.

### Magnet (public chat)

- Grounded in the profile header and public knowledge base documents.
- Public tools from skills (e.g. tailored CV, project deep dive,
  availability).
- Provider and prompt set by the owner; visitors cannot change them.
- Voice input/output and document upload (rate limited).

### Operators

- MCP server with scoped keys: read, content, review, settings.
- Tools for overview, blog, pages and blocks, projects, inbox,
  conversations, analytics, knowledge base, newsletter, review queue,
  settings, modules, navigation and automations.
- Every call logged; owner sees calls per operator.

### Autopilot

- Scheduled loop with skills, automations (cron/signal/event) and
  objectives.
- Research, blog and newsletter drafts, signals from Gmail and the Chrome
  extension.
- Guardrails: at most `max_waiting_reviews` waiting items, drafts expire
  after `draft_expiry_days`.

### Admin

- Overview with the north star, a visitor → chat → inquiry funnel and what
  needs attention.
- Review queue, Operators & Autopilot, Magnet settings.
- Content: knowledge base (versions, public/private), blog, projects, pages
  (block outline + JSON), media, newsletter.
- Audience: inbox, conversations, analytics.
- Platform: integrations, modules, site settings, activity log with restore.

## Non-goals

- Agent-to-agent federation (A2A) or a network of sites.
- A drag-and-drop page builder.
- Multi-tenant hosting; this is one person's site.
- Autopilot publishing or sending anything without an operator decision.

## Success measures

- Inquiries per month (north star) and the funnel visitors → chat →
  inquiry.
- Review queue stays small and is decided on (no pile-up of proposals).
- Knowledge base kept current (`site_overview` flags it after 30 days without
  change).
- No personal data or private content readable by visitors.
