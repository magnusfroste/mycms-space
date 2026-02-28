

# Autonomous Magnet Agent - Content Pipeline

## Vision

Transform Magnet from a reactive chat assistant into an autonomous digital twin that proactively creates content, monitors signals, and drives personal branding -- all while you sleep. Inspired by OpenClaw's "personal AI assistant" philosophy but tailored to your CMS with its existing presence and traffic.

## Architecture Overview

```text
+-------------------+     +-------------------+     +------------------+
|  Signal Sources   |     |  Agent Brain      |     |  Output          |
|                   |     |  (Edge Function)  |     |  Channels        |
|  - Gmail/LinkedIn +---->+                   +---->+  - Blog posts    |
|  - Firecrawl      |     |  Research         |     |  - Newsletter    |
|  - RSS feeds      |     |  Analyze          |     |  - Chat context  |
|  - GitHub trends  |     |  Draft            |     |                  |
+-------------------+     +-------------------+     +------------------+
                                    ^
                                    |
                          +-------------------+
                          |  Cron Scheduler   |
                          |  (pg_cron)        |
                          +-------------------+
```

## Phase 1: Autonomous Blog Pipeline

A new Edge Function `agent-autopilot` that can be triggered on a schedule or manually from admin.

### What it does:
1. **Research** - Uses Firecrawl to scrape trending topics from configured sources (Hacker News, specific blogs, LinkedIn trending)
2. **Analyze** - AI evaluates which topics align with Magnus's expertise and brand
3. **Draft** - Generates a blog post draft with proper SEO metadata
4. **Queue** - Saves as draft in `blog_posts` table with status `draft` and a new `source` field (`manual` | `agent`)
5. **Notify** - Admin gets a notification (or webhook trigger) that a new draft is ready for review

### New database table: `agent_tasks`
Tracks autonomous agent runs and their outputs.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| task_type | text | `research`, `blog_draft`, `newsletter_draft`, `inbox_digest` |
| status | text | `pending`, `running`, `completed`, `failed`, `needs_review` |
| input_data | jsonb | Sources, topics, parameters |
| output_data | jsonb | Generated content, analysis |
| created_at | timestamp | When queued |
| completed_at | timestamp | When finished |

### New AI tool: `research_and_draft`
Added to `ai-tools.ts` so Magnet can also be asked in chat: "Write a blog post about the latest in Agentic AI" and it will research + draft autonomously.

## Phase 2: Gmail/LinkedIn Signal Harvesting

### Approach: Google Gmail API via new connector

1. **Connect Gmail** - Use OAuth (Google connector or custom) with read-only scope for specific labels/filters
2. **Edge Function: `agent-inbox-scan`** - Runs on schedule, fetches emails matching filters (e.g., LinkedIn notifications, newsletter digests)
3. **Signal extraction** - AI summarizes key signals: who reached out, trending topics in network, opportunities
4. **Output options:**
   - Auto-generate "Weekly Network Digest" blog post
   - Feed signals into Magnet's context so it can mention recent activity
   - Create newsletter content from curated signals

### Gmail filter strategy (privacy-first):
- Only read emails from specific senders (LinkedIn, specific newsletters)
- Never store raw email content -- only AI-extracted summaries
- All processing happens in Edge Functions (server-side)

## Phase 3: Autonomous Newsletter

### Auto-curated newsletter flow:
1. `agent-autopilot` collects the week's content: new blog posts, GitHub activity, trending topics
2. AI generates a newsletter draft combining these signals
3. Draft saved to `newsletter_campaigns` with status `draft`
4. Admin reviews and approves (one-click send)
5. Or: fully autonomous with auto-send after 24h review window

## Phase 4: Enhanced Chat Context

Make Magnet aware of autonomous activity:
- "I recently wrote about X" (references agent-generated drafts)
- "Based on my LinkedIn activity this week..." (inbox signals)
- "I've been researching Y" (ongoing research tasks)

This enriches the `siteContext` with live activity data.

---

## Implementation Plan

### Step 1: Database setup
- Create `agent_tasks` table with RLS policies
- Add `source` column to `blog_posts` (`manual` | `agent`)
- Add `agent_notes` column to `newsletter_campaigns` for AI-generated context

### Step 2: Edge Function `agent-autopilot`
- Research mode: Firecrawl + AI analysis of configured sources
- Blog draft mode: Generate full blog post from research
- Newsletter draft mode: Curate weekly content
- Uses existing `ai-agent.ts` infrastructure (provider registry, tool calling)

### Step 3: New AI tools in `ai-tools.ts`
- `research_topic` - Deep research on a topic using Firecrawl
- `draft_blog_post` - Generate and save a blog draft
- `draft_newsletter` - Curate and draft a newsletter

### Step 4: Admin UI - Autopilot Dashboard
- New admin tab "Autopilot" showing agent task history
- Configure research sources (URLs to monitor)
- Toggle auto-draft for blog and newsletter
- Review queue for agent-generated content

### Step 5: Cron scheduling
- Use `pg_cron` + `pg_net` to trigger `agent-autopilot` on schedule
- Default: daily research scan, weekly newsletter draft

### Step 6: Gmail integration (Phase 2)
- Google OAuth connector setup
- `agent-inbox-scan` Edge Function
- Signal extraction and content pipeline

---

## What makes this unique

Unlike OpenClaw (which is a general-purpose local assistant), this is a **domain-specific autonomous agent** built into your CMS:

- **Presence-first**: Content goes live on your site with SEO, driving organic traffic
- **Brand-aligned**: AI knows your expertise, voice, and values from existing site context
- **Review loop**: Human-in-the-loop by default, full autonomy as an opt-in
- **Federated identity**: Aligns with the A2A/Agent Card roadmap -- your agent publishes content that other agents can discover

