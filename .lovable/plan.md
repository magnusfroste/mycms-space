

# Scout Mode: Intelligent Source Discovery

## Problem
Today, the Autopilot research pipeline requires you to manually list source URLs. But the real challenge is: *where* should you look? For a topic like "AI agents," the best insights might be scattered across HN, arXiv, specific Substacks, YouTube transcripts, or niche blogs you've never heard of. The agent should find the sources, not just scrape them.

## Solution
Add a new `scout` action to the Autopilot pipeline that uses a two-pass approach:

1. **Discovery pass** -- AI-powered web search to find and rank the most relevant, high-signal sources for a topic
2. **Deep-read pass** -- Scrape the top-ranked sources and synthesize findings
3. **Source map** -- Save discovered sources as reusable "source profiles" that improve over time

## How it works

```text
[Topic] --> [Firecrawl Search x3 angles] --> [AI: Rank & Filter] --> [Deep Scrape Top 5] --> [AI: Synthesize] --> [Source Report]
```

The scout doesn't just search once -- it generates multiple search angles from the topic (e.g., for "AI agents": technical papers, industry news, developer tools, thought leaders) to cast a wider net. Then AI ranks the results by signal quality and novelty before deep-reading.

## Changes

### 1. Edge function: `agent-autopilot/index.ts`
- Add new `scout` action
- New `scoutSources()` function:
  - Takes a topic, generates 3 search angles via AI
  - Runs parallel Firecrawl searches for each angle
  - Deduplicates results by domain
  - AI ranks sources by relevance, authority, and freshness
  - Deep-scrapes top 5-8 sources
  - Returns a structured report: best sources, key insights, recommended "watch list"
- Saves results as `scout` task type in `agent_tasks` with `output_data` containing the discovered source list

### 2. Autopilot Dashboard: `AutopilotDashboard.tsx`
- Add a "Scout" button alongside Research/Blog/Newsletter
- Uses a compass/radar icon
- No source URLs needed -- only a topic

### 3. Task History: `TaskHistoryItem.tsx`
- Render `scout` tasks with a source list showing domain, title, and relevance score
- "Use as Sources" button that copies discovered URLs into the research/blog source field

### 4. Config integration
- Scout results can optionally update `default_sources` in the autopilot module config
- This creates a feedback loop: scout discovers sources, which become the default for daily research

## Technical details

### Scout function (edge function)

```
async function handleScout(topic, supabase):
  1. Create agent_task (type: 'scout', status: 'running')
  2. AI generates 3 search queries from topic
     e.g., "AI agents" -> ["AI agent frameworks 2026", "agentic AI industry trends", "AI agent open source projects"]
  3. Parallel Firecrawl searches (3 queries, 5 results each = ~15 raw results)
  4. Deduplicate by domain, merge titles/descriptions
  5. AI ranks: score 1-10 on relevance, authority, freshness
     Returns top 8 with rationale
  6. Deep-scrape top 5 sources (Firecrawl markdown)
  7. AI synthesis: key takeaways + recommended "watch list" of domains
  8. Save to agent_tasks with output_data:
     { sources: [{url, title, score, rationale}], synthesis, watch_list, search_queries }
```

### UI additions

The Scout button in the action panel triggers with just a topic -- no sources needed. The result appears in Task History as a card showing:
- Discovered sources ranked by relevance
- One-click "Use these sources" to populate the research/blog source fields
- "Save as defaults" to update the autopilot config

## File changes

| File | Change |
|------|--------|
| `supabase/functions/agent-autopilot/index.ts` | Add `scout` action with `handleScout()` and `scoutSources()` |
| `src/components/admin/AutopilotDashboard.tsx` | Add Scout button, handle scout task results |
| `src/components/admin/autopilot/TaskHistoryItem.tsx` | Render scout results with source list and "Use as Sources" action |

## Scope boundaries
- No persistent "source database" table (uses `agent_tasks.output_data` for now)
- No automatic chaining (scout -> research -> blog) in this iteration
- No UI for editing individual source scores
- Firecrawl search API is already available and configured

