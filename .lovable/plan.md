

## Resume Module — Knowledge Base + Agency Integration

### Current State

- **CV Agent Block** (`CvAgentBlock.tsx`): Public-facing CTA that funnels JDs into `/chat` with `source: 'cv-agent'`
- **Resume Context** (`ai-context.ts`): `loadResumeContext()` scrapes *all* `page_blocks` for skills, values, projects — unstructured, flat
- **CV Agent Tool** (`ai-tools.ts`): `generate_tailored_cv` tool that Magnet uses to analyze JDs
- **No dedicated resume data model** — everything lives in page blocks as JSONB

### Problem

Resume data is scattered across page blocks (skills-bar, about-split, values, etc.) with no structured schema. The CV Agent reads whatever blocks exist but has no first-class knowledge base for experience, certifications, education, or role history.

### Plan: Resume Module

#### 1. New Database Table: `resume_entries`

A single structured table that serves as the canonical knowledge base:

```sql
CREATE TABLE public.resume_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL, -- 'experience' | 'education' | 'certification' | 'skill' | 'language' | 'summary'
  title text NOT NULL,
  subtitle text, -- company, institution, issuer
  description text,
  start_date date,
  end_date date,
  is_current boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}', -- level (for skills), url, etc.
  order_index integer DEFAULT 0,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.resume_entries ENABLE ROW LEVEL SECURITY;

-- Public read for visitor-facing features
CREATE POLICY "Public can view enabled resume entries"
  ON public.resume_entries FOR SELECT USING (enabled = true);

-- Admin full access
CREATE POLICY "Authenticated can manage resume entries"
  ON public.resume_entries FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

#### 2. Resume Module in `modules` table

Add `'resume'` to `ModuleType`. Config:

```typescript
interface ResumeModuleConfig {
  owner_name: string;
  owner_title: string;
  owner_summary: string;
  owner_location?: string;
  owner_availability?: 'available' | 'limited' | 'unavailable';
  availability_note?: string;
}
```

#### 3. Admin UI: Resume Manager (`src/components/admin/ResumeManager.tsx`)

New sidebar tab **Resume** (icon: `BookUser`) between Blog and Agency. Sections:

- **Profile** card — name, title, summary, availability toggle
- **Experience** — timeline entries with company, role, dates, description
- **Skills** — name + level + category (replaces scattered skills-bar data)
- **Education & Certifications** — grouped list
- Each section uses inline add/edit with the same minimal style as existing editors

#### 4. Upgrade `loadResumeContext()` in `ai-context.ts`

Replace the current block-scraping logic with a structured query:

```typescript
async function loadResumeContext(): Promise<string | null> {
  // 1. Load resume module config (profile summary)
  // 2. Load resume_entries ordered by category + order_index
  // 3. Format as structured markdown sections
  // Falls back to existing block-scraping if no resume_entries exist
}
```

This gives Magnet a clean, structured profile instead of parsing random block configs.

#### 5. Agency Integration

- **New agent skill**: `resume_lookup` — lets Magnet query `resume_entries` by category/tags during autonomous operations (e.g., when drafting proposals or responding to signals)
- **CV Agent Block unchanged** — still funnels to `/chat`, but now `generate_tailored_cv` uses the structured resume data instead of scraped blocks
- **Signal integration**: When resume entries change, optionally create an `agent_task` signal so Magnet can proactively update related content

#### 6. Files to Create/Edit

| Action | File |
|--------|------|
| Create | `supabase/migrations/..._resume_entries.sql` |
| Create | `src/components/admin/ResumeManager.tsx` |
| Create | `src/data/resume.ts` (data layer) |
| Create | `src/models/resume.ts` (React Query hooks) |
| Edit | `src/types/modules.ts` — add `'resume'` to ModuleType + ResumeModuleConfig |
| Edit | `src/models/modules.ts` — add `useResumeModule()` |
| Edit | `src/components/admin/AdminSidebar.tsx` — add Resume tab |
| Edit | `src/pages/Admin.tsx` — wire ResumeManager |
| Edit | `supabase/functions/_shared/ai-context.ts` — upgrade `loadResumeContext()` |
| Edit | `supabase/functions/_shared/ai-tools.ts` — add `resume_lookup` tool definition |

This keeps the CV Agent Block as the public interface while making Resume the structured knowledge backbone that powers both the agent's tools and the admin's content management.

