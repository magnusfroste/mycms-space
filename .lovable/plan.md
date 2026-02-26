

# Auto-Enrich GitHub Repos with AI

## What it does
A single "Auto-enrich" button (with sparkle icon) on each repo's edit form that generates all four text fields at once:
- **Display Title** -- a polished, human-friendly project name
- **Description** -- compelling project summary
- **Problem Statement** -- what problem it solves
- **Why It Matters** -- impact and relevance

The AI uses the repo's README, GitHub metadata (language, topics, stars), and optionally scrapes the homepage URL for additional context.

## How it works

```text
[Click "Auto-enrich"]
       |
       v
  Edge Function: enrich-github-repo
       |
       +-- Collects: README, description, language, topics, stars
       +-- If homepage URL exists --> calls firecrawl-scrape for page content
       |
       v
  AI prompt with all context --> generates JSON with 4 fields
       |
       v
  Fields populated in the form (user can review before saving)
```

## Changes

### 1. New Edge Function: `supabase/functions/enrich-github-repo/index.ts`
- Accepts: `readme`, `description`, `language`, `topics`, `homepage`, `name`, `stars`
- If `homepage` is provided, calls Firecrawl internally to scrape the page content
- Sends everything to AI with a structured prompt requesting JSON output with `title`, `description`, `problemStatement`, `whyItMatters`
- Uses existing `getAdminAICompletion` from shared AI provider
- Returns the four generated fields

### 2. New data function: `src/data/githubRepos.ts`
- Add `enrichWithAI()` function that calls the new edge function

### 3. New model hook: `src/models/githubRepos.ts`
- Add `useEnrichGitHubRepo()` mutation hook

### 4. Update UI: `src/components/admin/GitHubReposManager.tsx`
- Add "Auto-enrich" button at the top of the edit form (above the individual fields)
- On click: calls the mutation, populates all four form fields
- Shows loading state with spinner
- User reviews the generated text and clicks Save as usual (non-destructive)

### 5. Config: `supabase/config.toml`
- Add `[functions.enrich-github-repo]` with `verify_jwt = false`

## Technical details

**AI Prompt structure:**
The system prompt instructs the AI to return valid JSON with exactly four keys. It receives the full README, repo metadata, and optionally scraped homepage content as context.

**Firecrawl integration:**
The edge function calls Firecrawl server-side (using the existing `FIRECRAWL_API_KEY` secret) only when a homepage URL is present. This avoids an extra round-trip from the browser.

**No database changes** -- the generated text is populated into the form state, not saved automatically. The user retains full control.
