

# Multichannel Content Distribution for Autopilot

## Vision

Inspired by Buffer's "Create Once, Post Everywhere" (COPE) approach, we extend the Autopilot from 2 channels (blog + newsletter) to a multichannel system. One research session produces content adapted for each active channel -- all reviewable from one place.

## Current State

- Autopilot creates **blog drafts** and **newsletter drafts** as separate actions
- Each action is independent -- no shared "content brief" linking them
- Output is stored in `agent_tasks` with type-specific `output_data`

## Proposed Channels

| Channel | Output | Storage | Status |
|---------|--------|---------|--------|
| Blog | Long-form markdown post | `blog_posts` table | Existing |
| Newsletter | Email digest | `newsletter_campaigns` table | Existing |
| LinkedIn | Professional post (1300 chars) | `agent_tasks.output_data` | New |
| X/Twitter | Thread or single post (280 chars) | `agent_tasks.output_data` | New |

LinkedIn and X content is stored in `agent_tasks` as text to copy/paste -- no API integration needed initially (keeps it simple, avoids OAuth complexity).

## Architecture

```text
Research (topic + sources)
        |
        v
  Content Brief (AI synthesis)
        |
        +---> Blog Draft (800-1200 words)
        +---> Newsletter Snippet (300-500 words)
        +---> LinkedIn Post (1300 chars, professional tone)
        +---> X Thread (3-5 tweets, punchy tone)
```

### New Action: `multichannel_draft`

A single action that runs the full pipeline:
1. Research topic via Firecrawl
2. Generate a "content brief" (key angles, core message)
3. Fork into channel-specific AI prompts in parallel
4. Save each as a separate `agent_task` linked by a shared `batch_id`
5. Parent task status = `needs_review` until all children are handled

### Data Model Change

Add `batch_id` column to `agent_tasks`:
- Links related tasks from one multichannel run
- Nullable (existing tasks unaffected)
- Enables grouped display in the UI

Add new `task_type` values:
- `linkedin_post`
- `x_thread`

## Implementation Steps

### 1. Database Migration
- Add `batch_id` (text, nullable) to `agent_tasks`

### 2. Edge Function (`agent-autopilot`)
- Add `multichannel_draft` action
- Shared research step, then parallel AI generation per channel
- Each channel gets a tailored system prompt (tone, length, format)
- Create one `agent_task` per channel with same `batch_id`

### 3. Dashboard UI Updates
- Add "Multichannel Draft" button alongside existing actions
- Group tasks by `batch_id` in Task History (collapsible batch view)
- LinkedIn/X previews with copy-to-clipboard button and character count
- Channel selector: checkboxes to pick which channels to include

### 4. TaskHistoryItem Updates
- New preview components for `linkedin_post` and `x_thread`
- Copy button for social content
- Batch grouping header showing all channels in one row

### 5. WorkflowVisualizer
- New workflow node type showing the multichannel fork

## What This Does NOT Include (Keeping It Simple)
- No direct API posting to LinkedIn/X (copy-paste for now)
- No scheduling per channel
- No analytics per channel
- These can be added incrementally later

## Technical Notes
- Channel prompts are tuned per platform (LinkedIn = professional/storytelling, X = punchy/thread format)
- `batch_id` uses `crypto.randomUUID()` to group related tasks
- Existing blog/newsletter actions remain unchanged -- multichannel is additive

