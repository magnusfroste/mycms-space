
# Magnet Dual-Mode: Public Agent vs Private Agent

## Status: ✅ Implemented

The `/chat` route now detects authentication state and switches Magnet between two modes:

### Public Mode (visitors)
- Tools: CV Agent, Portfolio, Project Deep Dive, Availability
- Persona: "Magnet, Magnus's digital twin"

### Admin Mode (logged-in)
- Tools: Research, Draft Blog, Draft All Channels, Review Queue, Approve Task, Site Stats
- Persona: "Magnet CMS co-pilot"
- Admin badge shown in header

---

# Resume Module — Knowledge Base + Agency Integration

## Status: ✅ Implemented

### What was built

1. **Database**: `resume_entries` table with categories (experience, education, certification, skill, language, summary), RLS policies for public read + admin manage
2. **Resume Module Config**: Added `'resume'` to `ModuleType` with `ResumeModuleConfig` (owner_name, title, summary, location, availability)
3. **Data/Model layers**: `src/data/resume.ts` + `src/models/resume.ts` (React Query hooks)
4. **Admin UI**: `ResumeManager.tsx` with profile card + tabbed entry editor (add/edit/delete per category)
5. **AI Context**: `loadResumeContext()` upgraded to load structured `resume_entries` first, falls back to legacy block-scraping
6. **Agency Integration**: `resume_lookup` tool added so Magnet can query resume by category/tags
7. **Admin Sidebar**: Resume tab (BookUser icon) between Newsletter and Agency

### Files Changed

| File | Change |
|------|--------|
| `src/types/modules.ts` | Added `'resume'` to ModuleType, ResumeModuleConfig, defaults |
| `src/models/modules.ts` | Added `useResumeModule()` + `useUpdateResumeModule()` |
| `src/data/resume.ts` | New data layer |
| `src/models/resume.ts` | New React Query hooks |
| `src/components/admin/ResumeManager.tsx` | New admin UI |
| `src/components/admin/AdminSidebar.tsx` | Added Resume tab |
| `src/pages/Admin.tsx` | Wired ResumeManager |
| `supabase/functions/_shared/ai-context.ts` | Structured resume loader |
| `supabase/functions/_shared/ai-tools.ts` | `resume_lookup` tool + descriptions |

### Next Steps

- [ ] Add inline editor for Resume Block on landing page
- [ ] Implement `resume_lookup` handler in `agent-execute`
- [ ] Add signal trigger when resume entries change
- [ ] Import existing skills-bar data into resume_entries
