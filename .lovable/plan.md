

# Project Case Studies + Tech Stack Badges

## Overview
Two features that level up the GitHub portfolio module:
1. **Deep Dive Case Study Pages** -- dedicated `/project/:repoName` route per repo
2. **Tech Stack Badges** -- icon-based visual badges replacing plain text labels

No database changes needed -- all data already exists.

---

## Feature 1: Project Case Study Pages

### New route: `/project/:repoName`
A clean, editorial page combining CMS storytelling with GitHub technical data.

### Page layout (responsive)
```text
Desktop:
+------------------------------------------+
|  Header (existing)                        |
+------------------------------------------+
|  < Back to Portfolio                      |
|                                           |
|  [Language Badge]  [Stars]  [Forks]       |
|  Project Title (large, bold)              |
|  Short description                        |
|                                           |
|  [====== Hero Image (full width) ======]  |
|                                           |
|  --- The Problem ---                      |
|  problem_statement                        |
|                                           |
|  --- Why It Matters ---                   |
|  why_it_matters                           |
|                                           |
|  --- Tech Stack ---                       |
|  [TypeScript] [React] [Supabase] badges   |
|                                           |
|  --- About This Project ---               |
|  README rendered as markdown              |
|                                           |
|  [Image Gallery if multiple images]       |
|                                           |
|  [View on GitHub]  [Live Demo]            |
+------------------------------------------+
|  Footer (existing)                        |
+------------------------------------------+

Mobile: same sections, stacked vertically,
smaller typography, full-bleed images
```

### Files

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/pages/ProjectCaseStudy.tsx` | Page component with editorial layout |
| Create | `src/data/githubRepoByName.ts` | Single repo fetch by name |
| Create | `src/models/githubRepoByName.ts` | React Query hook for single repo |
| Modify | `src/App.tsx` | Add `/project/:repoName` route |
| Modify | `src/components/blocks/GitHubBlockLayouts.tsx` | Link card titles/images to case study page |

### Key design decisions
- Use existing `Header`, `Footer`, `SEOHead`, `MarkdownContent` components
- Internal `Link` on titles/images; external GitHub link stays as separate button
- Graceful fallback if repo has no enrichment -- still shows README + stats
- Loading skeleton while data fetches
- 404 redirect if repo not found or not enabled

---

## Feature 2: Tech Stack Badges with Icons

### Concept
Replace plain text language/topic labels with small icon + text badges using Lucide icons and a mapping table.

### Badge design
```text
[icon TypeScript]  -- language gets colored accent dot
[icon React]       -- topic gets outline style  
[icon Supabase]    -- unmapped items get generic Code icon
```

### Files

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/lib/constants/techStackIcons.tsx` | Map of tech names to Lucide icon components |
| Create | `src/components/common/TechBadge.tsx` | Reusable badge with icon lookup |
| Modify | `src/components/blocks/GitHubBlockLayouts.tsx` | Use TechBadge for languages and topics |

### Icon mapping approach
- Use Lucide icons that visually suggest the technology (e.g., `Code2` for TypeScript, `Terminal` for Python, `Database` for Supabase, `Globe` for web-app)
- Extend existing `languageColors.ts` for color accents
- Fallback: generic `Code` icon for any unmapped technology
- Case-insensitive lookup so "typescript" and "TypeScript" both work

---

## Implementation order
1. Create `techStackIcons.tsx` and `TechBadge.tsx` (standalone, no side effects)
2. Create data/model layer for single repo fetch
3. Create `ProjectCaseStudy.tsx` page (uses TechBadge + MarkdownContent)
4. Add route in `App.tsx`
5. Update `GitHubBlockLayouts.tsx` -- add internal links + swap to TechBadge

---

## What stays unchanged
- All existing layouts continue to work
- Database schema unchanged
- Admin enrichment workflow unchanged
- External GitHub links preserved alongside new internal links

