# mycms.space - Technical Architecture

**Version:** 1.0  
**Last Updated:** 2025-02-03  
**Status:** Active Development

> **Note:** For product requirements and features, see [PRD.md](./PRD.md)

---

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework with hooks
- **TypeScript** - Type safety and developer experience
- **Vite** - Lightning-fast build tool
- **TanStack Query (React Query)** - Server state management
- **React Router v6** - Client-side routing
- **shadcn/ui** - High-quality component library
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible primitives
- **Lucide React** - Beautiful icons
- **next-themes** - Dark/light mode
- **react-markdown** - Markdown rendering
- **embla-carousel** - Touch-friendly carousels
- **@dnd-kit** - Drag and drop

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL 15 database
  - Row Level Security (RLS)
  - Real-time subscriptions
  - Authentication
  - Storage (images, files)
  - Edge Functions (Deno runtime)

### Edge Functions (Deno)
- `ai-chat` - Universal AI chat handler
- `page-builder-chat` - AI page builder assistant
- `enhance-text` - AI text enhancement
- `firecrawl-scrape` - Web scraping
- `send-newsletter` - Email campaigns
- `sitemap-dynamic` - Dynamic sitemap generation

### External Services
- **Firecrawl** - Web scraping (via Lovable connector)
- **Resend** - Email delivery
- **Google Analytics** - Web analytics
- **n8n** - Workflow automation (user-hosted)

---

## � Documentation

- **[PRD.md](./PRD.md)** - Product Requirements Document (features, vision, user personas)
- **[ROADMAP.md](./ROADMAP.md)** - Future roadmap and phases
- **[DEPLOYMENT.md](../DEPLOYMENT.md)** - Deployment guides and setup instructions
- **[README.md](../README.md)** - Quick start and overview

---

## �💾 Database Schema

### Core Tables

#### `pages`
Dynamic pages with custom slugs.
```sql
- id (uuid, primary key)
- slug (text, unique)
- title (text)
- description (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `page_blocks`
All page content stored as JSONB blocks.
```sql
- id (uuid, primary key)
- page_slug (text, foreign key → pages.slug)
- block_type (text) -- 'hero', 'about', 'projects', etc.
- block_config (jsonb) -- All block data
- order_index (integer)
- enabled (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

**Key Design Decision:** JSONB storage allows adding new block types and fields without database migrations. AI agents can easily read and modify block configurations.

#### `page_blocks_history`
Automatic version control for all block changes.
```sql
- id (uuid, primary key)
- block_id (uuid)
- page_slug (text)
- block_type (text)
- block_config (jsonb)
- order_index (integer)
- enabled (boolean)
- changed_at (timestamp)
- change_type (text) -- 'insert', 'update', 'delete'
```

#### `blogs`
Blog posts with Markdown content.
```sql
- id (uuid, primary key)
- slug (text, unique)
- title (text)
- excerpt (text)
- content (text) -- Markdown
- cover_image (text)
- published (boolean)
- published_at (timestamp)
- reading_time (integer) -- minutes
- created_at (timestamp)
- updated_at (timestamp)
```

#### `blog_categories`
Blog categorization.
```sql
- id (uuid, primary key)
- name (text, unique)
- slug (text, unique)
- description (text)
```

#### `projects`
Portfolio projects.
```sql
- id (uuid, primary key)
- title (text)
- description (text)
- image_url (text)
- demo_link (text)
- category_id (uuid, foreign key)
- order_index (integer)
- enabled (boolean)
```

#### `modules`
Generalized module configuration system.
```sql
- id (uuid, primary key)
- module_type (text) -- 'ai', 'projects', 'blog', 'seo', etc.
- module_config (jsonb) -- Type-specific configuration
- enabled (boolean)
```

**Module Types:**
- `ai` - AI chat configuration, integrations, system prompts
- `projects` - Project display settings
- `blog` - Blog configuration
- `seo` - SEO meta tags
- `header` - Header/navigation settings
- `footer` - Footer configuration
- `newsletter` - Email settings
- `analytics` - Tracking configuration

#### `nav_links`
Navigation menu items.
```sql
- id (uuid, primary key)
- label (text)
- href (text)
- order_index (integer)
- enabled (boolean)
```

#### `newsletter_subscribers`
Email subscribers.
```sql
- id (uuid, primary key)
- email (text, unique)
- subscribed_at (timestamp)
- unsubscribed_at (timestamp)
```

#### `statistics`
Analytics events.
```sql
- id (uuid, primary key)
- event_type (text) -- 'page_visit', 'demo_click', 'chat_session'
- page (text)
- project (text)
- timestamp (timestamp)
- user_agent (text)
- referrer (text)
```

---

## 🏗️ Technical Architecture

### Data-Model-View (DMV) Pattern

This project follows a **Data-Model-View (DMV)** architecture pattern to maintain clean separation of concerns.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      VIEW LAYER                              │
│                  src/components/                             │
│         Pure UI components, no business logic                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     MODEL LAYER                              │
│                     src/models/                              │
│    React Query hooks, business logic, UI feedback (toasts)  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
│                      src/data/                               │
│         Pure API calls to Supabase, no UI logic              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       TYPES                                  │
│                     src/types/                               │
│              Shared TypeScript interfaces                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Layer Descriptions

### 1. Data Layer (`src/data/`)

**Purpose:** Pure API calls to Supabase. No React hooks, no UI logic, no toast notifications.

**What belongs here:**
- Direct Supabase queries (select, insert, update, delete)
- Storage operations (upload, delete files)
- Realtime subscription setup helpers
- Data transformation from DB format to app format

**What does NOT belong here:**
- React hooks (`useQuery`, `useMutation`, `useState`, etc.)
- Toast notifications or any UI feedback
- Business logic decisions
- QueryClient invalidation

**Example:**
```typescript
// src/data/projects.ts
import { supabase } from '@/integrations/supabase/client';
import type { Project } from '@/types';

export const fetchProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data as Project[];
};

export const deleteProject = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
```

---

### 2. Model Layer (`src/models/`)

**Purpose:** Business logic, React Query hooks, cache management, and UI feedback.

**What belongs here:**
- React Query hooks (`useQuery`, `useMutation`)
- Cache invalidation (`queryClient.invalidateQueries`)
- Toast notifications for success/error feedback
- Default values and fallback data
- Realtime subscriptions with React lifecycle

**What does NOT belong here:**
- Direct Supabase calls (use data layer functions instead)
- UI rendering logic
- Component-specific state

**Example:**
```typescript
// src/models/projects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import * as projectsData from '@/data/projects';
import type { Project } from '@/types';

export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: projectsData.fetchProjects,
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: projectsData.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: 'Success', description: 'Project deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};
```

---

### 3. View Layer (`src/components/`)

**Purpose:** Pure UI rendering. Receives data and callbacks from models.

**What belongs here:**
- JSX/TSX markup and styling
- Component-local UI state (modals, forms, loading states)
- Event handlers that call model hooks
- Conditional rendering based on props/state

**What does NOT belong here:**
- Direct Supabase calls
- Business logic decisions
- Data fetching logic (use model hooks)

**Example:**
```typescript
// src/components/ProjectList.tsx
import { useProjects, useDeleteProject } from '@/models';

export const ProjectList = () => {
  const { data: projects, isLoading } = useProjects();
  const deleteProject = useDeleteProject();

  if (isLoading) return <Skeleton />;

  return (
    <div>
      {projects?.map(project => (
        <ProjectCard 
          key={project.id} 
          project={project}
          onDelete={() => deleteProject.mutate(project.id)}
        />
      ))}
    </div>
  );
};
```

---

### 4. Types (`src/types/`)

**Purpose:** Shared TypeScript interfaces used across all layers.

**What belongs here:**
- Entity interfaces (Project, Category, etc.)
- Input/Output types for mutations
- Shared enums and constants
- Block configuration types (`src/types/blockConfigs.ts`)

---

## Block-Based CMS Architecture

The application uses a **JSONB-based block storage** pattern where all block content is stored in `page_blocks.block_config`. This provides:

1. **Flexibility:** New block types and fields can be added without database migrations
2. **Unified versioning:** Single trigger on `page_blocks` handles all history
3. **AI-friendly:** Simple JSON structure for AI to read and update
4. **Performance:** Single table for all page content

### Block Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    page_blocks table                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ id | page_slug | block_type | block_config (JSONB)      ││
│  │────│───────────│────────────│────────────────────────────││
│  │ x  │ "home"    │ "hero"     │ { name, tagline, ... }    ││
│  │ y  │ "home"    │ "about"    │ { intro_text, skills, ... }││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BlockRenderer                             │
│   Reads block_config and passes to appropriate component     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│         HeroBlock / AboutSplitBlock / etc.                   │
│   Receives config prop, renders content directly             │
└─────────────────────────────────────────────────────────────┘
```

### Block Config Types

All block configurations are defined in `src/types/blockConfigs.ts`:

```typescript
interface HeroBlockConfig {
  name?: string;
  tagline?: string;
  features?: Array<{ text: string; icon: string }>;
  enable_animations?: boolean;
}

interface AboutSplitBlockConfig {
  name?: string;
  intro_text?: string;
  skills?: Array<{ title: string; description: string; icon: string }>;
}
// ... etc
```

### Recommended: Import from Models
```typescript
// Components should import from models
import { useProjects, useDeleteProject } from '@/models';
import type { Project } from '@/types';
```

### Legacy: Import from Hooks (Backward Compatible)
```typescript
// Old imports still work via re-exports
import { useProjects } from '@/hooks/useProjectSettings';
```

---

## Adding a New Entity

When adding a new entity (e.g., "Tags"), follow these steps:

### Step 1: Add Types
```typescript
// src/types/index.ts
export interface Tag {
  id: string;
  name: string;
  color: string;
}
```

### Step 2: Create Data Layer
```typescript
// src/data/tags.ts
import { supabase } from '@/integrations/supabase/client';
import type { Tag } from '@/types';

export const fetchTags = async (): Promise<Tag[]> => {
  const { data, error } = await supabase.from('tags').select('*');
  if (error) throw error;
  return data;
};
```

### Step 3: Create Model Layer
```typescript
// src/models/tags.ts
import { useQuery } from '@tanstack/react-query';
import * as tagsData from '@/data/tags';

export const useTags = () => {
  return useQuery({
    queryKey: ['tags'],
    queryFn: tagsData.fetchTags,
  });
};
```

### Step 4: Export from Index Files
```typescript
// src/data/index.ts
export * from './tags';

// src/models/index.ts
export { useTags } from './tags';
export type { Tag } from './tags';
```

### Step 5: Create Legacy Hook (Optional)
```typescript
// src/hooks/useTags.ts
export { useTags } from '@/models/tags';
export type { Tag } from '@/models/tags';
```

---

## File Structure

```
src/
├── data/                    # Data Layer
│   ├── index.ts             # Re-exports all data functions
│   ├── projects.ts
│   ├── hero.ts
│   ├── aboutMe.ts
│   ├── categories.ts
│   ├── expertise.ts
│   ├── featured.ts
│   ├── quickActions.ts
│   ├── chatSettings.ts
│   ├── portfolioSettings.ts
│   └── navLinks.ts
│
├── models/                  # Model Layer
│   ├── index.ts             # Re-exports all hooks and types
│   ├── projects.ts
│   ├── hero.ts
│   ├── aboutMe.ts
│   ├── categories.ts
│   ├── expertise.ts
│   ├── featured.ts
│   ├── quickActions.ts
│   ├── chatSettings.ts
│   ├── portfolioSettings.ts
│   └── navLinks.ts
│
├── types/                   # Shared Types
│   └── index.ts
│
├── hooks/                   # Legacy Hooks (re-exports)
│   ├── useProjectSettings.ts
│   ├── useHeroSettings.ts
│   └── ...
│
└── components/              # View Layer
    ├── admin/
    ├── ui/
    └── ...
```

---

## Benefits

1. **Testability:** Data layer can be unit tested without React
2. **Reusability:** Same data functions work in different contexts
3. **Maintainability:** Clear ownership of responsibilities
4. **Flexibility:** Easy to swap data sources (e.g., Supabase → REST API)
5. **Debugging:** Errors are easier to trace to their source layer

---

## Quick Reference

| Layer | Location | Contains | Imports From |
|-------|----------|----------|--------------|
| Data | `src/data/` | Supabase calls, storage ops | `supabase/client`, `types` |
| Model | `src/models/` | React Query hooks, toasts | `data`, `types`, `hooks/use-toast` |
| View | `src/components/` | UI components | `models`, `types`, `ui` |
| Types | `src/types/` | TypeScript interfaces | (none) |

---

## 🗺️ Product Roadmap

### Phase 1: Foundation ✅ (Completed)
- [x] Block-based page builder
- [x] Dynamic pages system
- [x] Blog platform with Markdown
- [x] Project portfolio
- [x] Admin dashboard
- [x] Supabase integration
- [x] Authentication
- [x] Basic analytics

### Phase 2: AI-Native Features ✅ (Completed)
- [x] Multi-provider AI chat system
- [x] n8n webhook integration
- [x] Site context injection
- [x] Lovable AI integration
- [x] OpenAI direct integration
- [x] Gemini direct integration
- [x] Configurable system prompts
- [x] AI page builder assistant
- [x] Text enhancement AI

### Phase 3: Integrations & Automation ✅ (Completed)
- [x] Firecrawl web scraping
- [x] Resend email delivery
- [x] Newsletter system
- [x] Contact form handling
- [x] Google Analytics
- [x] Version history
- [x] Real-time updates

### Phase 4: Enhanced Features 🚧 (In Progress)
- [ ] **Airtable Integration** - Sync data to/from Airtable
- [ ] **Advanced n8n Templates** - Pre-built workflows for common use cases
- [ ] **AI Content Generation** - Generate blog posts, project descriptions
- [ ] **Image AI** - DALL-E/Midjourney integration for image generation
- [ ] **Voice Chat** - Voice interface for AI assistant
- [ ] **Multi-language Support** - i18n for global audiences
- [ ] **Custom Domains** - Easy domain configuration
- [ ] **RSS Feed** - Auto-generated blog RSS
- [ ] **Sitemap** - Dynamic sitemap generation
- [ ] **SEO Analyzer** - AI-powered SEO recommendations

### Phase 5: Advanced Capabilities 📋 (Planned)
- [ ] **Ollama Integration** - Self-hosted LLM support
- [ ] **A/B Testing** - Built-in experimentation
- [ ] **Advanced Analytics** - Heatmaps, session recordings
- [ ] **E-commerce** - Product listings and payments
- [ ] **Membership** - Gated content and subscriptions
- [ ] **API Access** - RESTful API for external integrations
- [ ] **Webhooks** - Event-driven integrations
- [ ] **Multi-user** - Team collaboration features
- [ ] **White-label** - Rebrand for agencies
- [ ] **Mobile App** - Native iOS/Android admin app

### Phase 6: AI Agent Ecosystem 🔮 (Vision)
- [ ] **Autonomous Content Manager** - AI that manages your site
- [ ] **Smart Recommendations** - AI suggests improvements
- [ ] **Auto-optimization** - AI optimizes for conversions
- [ ] **Predictive Analytics** - AI forecasts trends
- [ ] **Natural Language CMS** - Manage site via conversation
- [ ] **AI Marketplace** - Share and sell AI agents
- [ ] **Multi-agent Workflows** - Coordinated AI teams

---

## 👨‍💻 Development Guide

### For AI Agents

When working on mycms.space, follow these principles:

#### 1. **Understand the Architecture**
- Always use DMV pattern (Data-Model-View)
- Data layer = pure Supabase calls
- Model layer = React Query hooks + business logic
- View layer = UI components only

#### 2. **Adding New Features**

**New Block Type:**
```typescript
// 1. Define type in src/types/blockConfigs.ts
export interface MyNewBlockConfig {
  title?: string;
  content?: string;
}

// 2. Create component in src/components/blocks/MyNewBlock.tsx
export const MyNewBlock: React.FC<{ config: MyNewBlockConfig }> = ({ config }) => {
  return <div>{config.title}</div>;
};

// 3. Register in src/components/blocks/BlockRenderer.tsx
case 'my-new-block':
  return <MyNewBlock config={block.block_config as MyNewBlockConfig} />;

// 4. Add to admin block selector
```

**New Data Entity:**
```typescript
// 1. Create migration in supabase/migrations/
CREATE TABLE my_entity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

// 2. Define type in src/types/index.ts
export interface MyEntity {
  id: string;
  name: string;
  created_at?: string;
}

// 3. Create data layer in src/data/myEntity.ts
export const fetchMyEntities = async (): Promise<MyEntity[]> => {
  const { data, error } = await supabase.from('my_entity').select('*');
  if (error) throw error;
  return data;
};

// 4. Create model layer in src/models/myEntity.ts
export const useMyEntities = () => {
  return useQuery({
    queryKey: ['myEntities'],
    queryFn: fetchMyEntities,
  });
};

// 5. Use in components
const { data: entities } = useMyEntities();
```

**New AI Integration:**
```typescript
// 1. Add to src/types/modules.ts
export type AIIntegrationType = 'n8n' | 'openai' | 'gemini' | 'mynewai';

export interface MyNewAIIntegration extends AIIntegrationBase {
  type: 'mynewai';
  api_key_ref?: string;
  model: string;
}

// 2. Add handler in supabase/functions/ai-chat/index.ts
case "mynewai":
  responseText = await handleMyNewAI(messages, integration.model, customSystemPrompt, siteContext);
  break;

// 3. Add UI in src/components/admin/IntegrationsManager.tsx
```

#### 3. **Code Quality Standards**

**Always:**
- Use TypeScript strict mode
- Follow DMV architecture
- Add proper error handling
- Use React Query for server state
- Keep components small and focused
- Write descriptive variable names
- Add comments for complex logic

**Never:**
- Put Supabase calls in components
- Put UI logic in data layer
- Hardcode values (use config)
- Skip error handling
- Ignore TypeScript errors
- Create god components

#### 4. **Testing Approach**

Before committing:
1. Test in dev environment (`npm run dev`)
2. Check TypeScript (`npm run lint`)
3. Test all user flows
4. Verify mobile responsiveness
5. Check dark/light mode
6. Test with real data

#### 5. **Database Changes**

When modifying database:
1. Create migration file with timestamp
2. Use descriptive migration names
3. Add RLS policies for security
4. Test rollback scenario
5. Update TypeScript types
6. Document in ARCHITECTURE.md

#### 6. **AI Chat Integration**

When working with AI features:
- Site context is automatically injected
- System prompt is configurable per user
- Support all providers (n8n, Lovable, OpenAI, Gemini)
- Handle errors gracefully
- Show loading states
- Store conversation in browser (not DB)

#### 7. **Performance Optimization**

- Use React Query caching
- Lazy load images
- Code split routes
- Minimize bundle size
- Use Supabase realtime sparingly
- Optimize images before upload
- Use CDN for static assets

---

## 🤖 AI Agent Instructions

### For Code Generation

When an AI agent (like you!) is asked to modify mycms.space:

1. **Read this document first** - Understand the architecture
2. **Check existing patterns** - Look at similar features
3. **Follow DMV** - Respect the layer separation
4. **Use TypeScript** - Leverage type safety
5. **Test thoroughly** - Verify changes work
6. **Document changes** - Update this file if needed

### Common Tasks

**"Add a new block type"**
→ Follow "New Block Type" guide above

**"Add AI provider"**
→ Follow "New AI Integration" guide above

**"Fix a bug"**
→ Identify layer (Data/Model/View), fix in correct place

**"Improve performance"**
→ Check React Query cache, optimize queries, lazy load

**"Add feature"**
→ Design data model → Create migration → Build layers → Add UI

### Key Files to Know

- `src/types/blockConfigs.ts` - All block configurations
- `src/types/modules.ts` - Module system and integrations
- `src/components/blocks/BlockRenderer.tsx` - Block rendering logic
- `supabase/functions/ai-chat/index.ts` - AI chat handler
- `src/components/admin/IntegrationsManager.tsx` - Integration UI
- `src/models/index.ts` - All data hooks
- `src/data/index.ts` - All data functions

---

## 🎓 Learning Resources

### For New Contributors

**Understanding the Stack:**
1. React Query: https://tanstack.com/query/latest
2. Supabase: https://supabase.com/docs
3. shadcn/ui: https://ui.shadcn.com
4. Tailwind CSS: https://tailwindcss.com/docs

**Understanding the Patterns:**
1. Read this ARCHITECTURE.md fully
2. Study existing blocks in `src/components/blocks/`
3. Review data flow in `src/data/` → `src/models/` → `src/components/`
4. Examine AI integration in `supabase/functions/ai-chat/`

**Best Practices:**
1. Keep it simple - Less is more
2. Quality over quantity - Focus on functionality
3. Data-Model-View separation - Always
4. Type safety - Use TypeScript fully
5. User experience - Test everything

---

## 📝 Contributing Guidelines

### Code Style
- Use functional components with hooks
- Prefer const over let
- Use arrow functions
- Destructure props
- Use optional chaining (?.)
- Use nullish coalescing (??)

### Git Workflow
1. Create feature branch from main
2. Make focused commits
3. Write descriptive commit messages
4. Test before pushing
5. Create PR with description
6. Request review

### Commit Message Format
```
feat: Add new hero block animation
fix: Resolve chat context injection bug
docs: Update ARCHITECTURE.md with new patterns
refactor: Simplify block renderer logic
perf: Optimize image loading
```

---

## 🚀 Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Edge functions deployed
- [ ] Supabase secrets set
- [ ] Domain configured
- [ ] SSL certificate active
- [ ] Analytics tracking verified
- [ ] Email sending tested
- [ ] AI integrations working
- [ ] Performance optimized

### Environment Variables
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Secrets
```bash
# Set via Supabase dashboard or CLI
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
FIRECRAWL_API_KEY=...
RESEND_API_KEY=...
LOVABLE_API_KEY=...
```

---

## � Security & Secrets Management

### Supabase Secrets

**All secrets should be stored in Supabase secrets**, not in code or environment variables.

**Adding Secrets:**
```bash
# Via CLI
supabase secrets set OPENAI_API_KEY=your-key
supabase secrets set FIRECRAWL_API_KEY=your-key
supabase secrets set RESEND_API_KEY=your-key

# Via Dashboard
# Supabase Dashboard → Project → Edge Functions → Secrets
```

**Available Secrets:**
- `OPENAI_API_KEY` - AI chat (GPT models)
- `GEMINI_API_KEY` - AI chat (Gemini models)
- `FIRECRAWL_API_KEY` - Web scraping
- `RESEND_API_KEY` - Email delivery
- `N8N_API_KEY` - Workflow automation

**Automatically Available:**
- `SUPABASE_URL` - Project URL
- `SUPABASE_ANON_KEY` - Public key
- `SUPABASE_SERVICE_ROLE_KEY` - Admin access

**Best Practices:**
- Never commit secrets to Git
- Use Supabase secrets for all API keys
- Rotate secrets regularly
- Use environment-specific secrets

---

## �📞 Support & Community

### Getting Help
- Read this documentation
- Check existing issues on GitHub
- Ask in discussions
- Contact maintainers

### Reporting Bugs
1. Check if already reported
2. Provide reproduction steps
3. Include error messages
4. Specify environment
5. Add screenshots if relevant

### Feature Requests
1. Describe the use case
2. Explain expected behavior
3. Consider implementation complexity
4. Discuss in issues first

---

**Last Updated:** 2025-02-03  
**Maintained by:** mycms.space team  
**License:** MIT

---

*This document is designed to be read by both humans and AI agents. It provides comprehensive knowledge about mycms.space architecture, features, and development practices.*
