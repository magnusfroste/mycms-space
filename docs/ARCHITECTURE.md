# Data-Model-View Architecture

This project follows a **Data-Model-View (DMV)** architecture pattern to maintain clean separation of concerns. This document explains each layer and when to use them.

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
