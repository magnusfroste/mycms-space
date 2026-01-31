# Modules-arkitektur - Komplett Plan

## Översikt

Centraliserad modul-hantering med en generell `modules`-tabell som ersätter individuella modultabeller och ger en konsekvent, skalbar arkitektur.

```text
┌─────────────────────────────────────────────────────────────────┐
│                     MODULES-ARKITEKTUR                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  modules-tabell (generell)                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ id | module_type | enabled | module_config (JSONB)          ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ 1  | 'ai'        | true    | {webhook_url, provider}        ││
│  │ 2  | 'projects'  | true    | {layout_style, show_categories}││
│  │ 3  | 'newsletter'| false   | {provider, api_key_ref}        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  page_blocks.block_config (JSONB)                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Allt block-specifikt innehåll:                              ││
│  │ - Chat: title, subtitle, placeholders, quick_actions        ││
│  │ - Projects: section_title, projects[], categories[]         ││
│  │ - Hero: name, tagline, features[]                           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fas 1: Skapa modules-tabell

### 1.1 Databasmigrering

```sql
-- Skapa generell modules-tabell
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_type TEXT NOT NULL UNIQUE,
  module_config JSONB DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read modules"
ON public.modules FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage modules"
ON public.modules FOR ALL USING (true) WITH CHECK (true);

-- Trigger för updated_at
CREATE TRIGGER update_modules_updated_at
BEFORE UPDATE ON public.modules
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger för versionshistorik
CREATE TRIGGER log_modules_changes
BEFORE UPDATE OR DELETE ON public.modules
FOR EACH ROW EXECUTE FUNCTION log_settings_change();
```

### 1.2 Migrera ai_module → modules

```sql
-- Migrera befintlig ai_module-data
INSERT INTO public.modules (module_type, module_config, enabled)
SELECT 
  'ai',
  jsonb_build_object(
    'webhook_url', webhook_url,
    'provider', provider
  ),
  enabled
FROM public.ai_module
LIMIT 1;

-- Skapa projects-modul (om den inte finns)
INSERT INTO public.modules (module_type, module_config, enabled)
VALUES (
  'projects',
  jsonb_build_object(
    'layout_style', 'alternating',
    'show_categories', true,
    'link_to_detail_pages', true,
    'items_per_page', 6
  ),
  true
) ON CONFLICT (module_type) DO NOTHING;
```

### 1.3 Ta bort legacy ai_module-tabell

```sql
-- Efter verifiering att migreringen lyckades
DROP TABLE IF EXISTS public.ai_module;
```

---

## Fas 2: TypeScript-typer

### 2.1 Ny typfil: src/types/modules.ts

```typescript
// ============================================
// Module Types
// Generell modul-konfiguration
// ============================================

// Bas-modul
export interface Module {
  id: string;
  module_type: ModuleType;
  module_config: ModuleConfigType;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

// Tillgängliga modultyper
export type ModuleType = 'ai' | 'projects' | 'newsletter' | 'analytics';

// AI-modul config
export interface AIModuleConfig {
  webhook_url: string;
  provider: 'n8n' | 'custom' | 'lovable';
}

// Projekt-modul config
export interface ProjectsModuleConfig {
  layout_style: 'alternating' | 'grid' | 'carousel' | 'masonry';
  show_categories: boolean;
  link_to_detail_pages: boolean;
  items_per_page: number;
}

// Newsletter-modul config (framtida)
export interface NewsletterModuleConfig {
  provider: 'mailchimp' | 'convertkit' | 'custom';
  api_key_ref?: string;
  list_id?: string;
}

// Union-typ för alla configs
export type ModuleConfigType = 
  | AIModuleConfig 
  | ProjectsModuleConfig 
  | NewsletterModuleConfig;

// Type-safe mapping
export interface ModuleTypeConfigMap {
  'ai': AIModuleConfig;
  'projects': ProjectsModuleConfig;
  'newsletter': NewsletterModuleConfig;
}

// Helper för att hämta config-typ
export type ConfigForModule<T extends ModuleType> = ModuleTypeConfigMap[T];

// Default configs
export const defaultModuleConfigs: ModuleTypeConfigMap = {
  'ai': {
    webhook_url: '',
    provider: 'n8n',
  },
  'projects': {
    layout_style: 'alternating',
    show_categories: true,
    link_to_detail_pages: true,
    items_per_page: 6,
  },
  'newsletter': {
    provider: 'mailchimp',
  },
};
```

---

## Fas 3: Data Layer

### 3.1 src/data/modules.ts

```typescript
// ============================================
// Data Layer: Modules
// Pure Supabase API calls
// ============================================

import { supabase } from '@/integrations/supabase/client';
import type { Module, ModuleType, ModuleConfigType } from '@/types/modules';

export const fetchModule = async <T extends ModuleType>(
  moduleType: T
): Promise<Module | null> => {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('module_type', moduleType)
    .maybeSingle();

  if (error) throw error;
  return data as Module | null;
};

export const fetchAllModules = async (): Promise<Module[]> => {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .order('module_type');

  if (error) throw error;
  return (data || []) as Module[];
};

export const updateModule = async <T extends ModuleType>(
  moduleType: T,
  updates: Partial<{ enabled: boolean; module_config: ModuleConfigType }>
): Promise<Module> => {
  const { data, error } = await supabase
    .from('modules')
    .update(updates)
    .eq('module_type', moduleType)
    .select()
    .single();

  if (error) throw error;
  return data as Module;
};

export const createModule = async (
  moduleType: ModuleType,
  config: ModuleConfigType,
  enabled = true
): Promise<Module> => {
  const { data, error } = await supabase
    .from('modules')
    .insert({
      module_type: moduleType,
      module_config: config,
      enabled,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Module;
};
```

---

## Fas 4: Model Layer

### 4.1 src/models/modules.ts

```typescript
// ============================================
// Model Layer: Modules
// React Query hooks + business logic
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as modulesData from '@/data/modules';
import type { Module, ModuleType, ConfigForModule } from '@/types/modules';

// Query keys
export const modulesKeys = {
  all: ['modules'] as const,
  byType: (type: ModuleType) => ['modules', type] as const,
};

// Fetch single module by type
export const useModule = <T extends ModuleType>(moduleType: T) => {
  return useQuery({
    queryKey: modulesKeys.byType(moduleType),
    queryFn: () => modulesData.fetchModule(moduleType),
  });
};

// Fetch all modules
export const useAllModules = () => {
  return useQuery({
    queryKey: modulesKeys.all,
    queryFn: modulesData.fetchAllModules,
  });
};

// Update module
export const useUpdateModule = <T extends ModuleType>(moduleType: T) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<{ enabled: boolean; module_config: ConfigForModule<T> }>) =>
      modulesData.updateModule(moduleType, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modulesKeys.byType(moduleType) });
      queryClient.invalidateQueries({ queryKey: modulesKeys.all });
    },
  });
};

// Convenience hooks för specifika moduler
export const useAIModule = () => useModule('ai');
export const useProjectsModule = () => useModule('projects');

// Type-safe config accessor
export const getModuleConfig = <T extends ModuleType>(
  module: Module | null | undefined,
  moduleType: T
): ConfigForModule<T> | null => {
  if (!module || module.module_type !== moduleType) return null;
  return module.module_config as ConfigForModule<T>;
};
```

---

## Fas 5: Uppdatera komponenter

### 5.1 Skapa ModuleSettings.tsx (generell)

```typescript
// src/components/admin/ModuleSettings.tsx
// Generell modul-editor som renderar rätt UI baserat på module_type
```

### 5.2 Uppdatera AdminSidebar

```text
Moduler (nytt avsnitt)
├── AI Modul
├── Projekt  ← NY
└── (framtida moduler)
```

### 5.3 Migrera AIModuleSettings

- Uppdatera för att använda `useModule('ai')` istället för `useAIModule()`
- Samma UI, ny datakälla

### 5.4 Skapa ProjectsModuleSettings

- Layout-väljare (alternating/grid/carousel/masonry)
- Kategorifilter on/off
- Länk till detaljsidor on/off

---

## Fas 6: Dynamiska projektsidor (framtida)

### 6.1 Route: /projekt/[slug]

```typescript
// src/pages/ProjectDetail.tsx
// Läser projekt från page_blocks där block_type = 'project-showcase'
// Hittar projekt via slug i block_config.projects[]
```

### 6.2 SEO-optimering

- Generera meta-tags från projektdata
- Strukturerad data (JSON-LD)
- Canonical URLs

---

## Migreringsplan

### Steg-för-steg

| Steg | Åtgärd | Status |
|------|--------|--------|
| 1 | Skapa `modules`-tabell | ⬜ |
| 2 | Migrera `ai_module` → `modules` | ⬜ |
| 3 | Skapa TypeScript-typer | ⬜ |
| 4 | Skapa data/modules.ts | ⬜ |
| 5 | Skapa models/modules.ts | ⬜ |
| 6 | Uppdatera AIModuleSettings | ⬜ |
| 7 | Skapa ProjectsModuleSettings | ⬜ |
| 8 | Uppdatera AdminSidebar | ⬜ |
| 9 | Testa och verifiera | ⬜ |
| 10 | Ta bort legacy `ai_module`-tabell | ⬜ |
| 11 | Uppdatera ProjectShowcaseBlock | ⬜ |
| 12 | (Framtida) Dynamiska projektsidor | ⬜ |

---

## Fördelar med denna arkitektur

| Aspekt | Fördel |
|--------|--------|
| **Skalbarhet** | Nya moduler = ny rad i tabellen |
| **Konsistens** | Samma mönster som page_blocks (type + config) |
| **Versionshistorik** | Automatisk via befintlig trigger |
| **Type Safety** | Generiska TypeScript-typer |
| **Enkel admin** | En vy för alla moduler |
| **AI-vänlig** | Enhetligt JSONB-interface |

---

## Arkitektur efter implementation

```text
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE TABLES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  modules                    page_blocks                          │
│  ────────                   ───────────                          │
│  module_type (unique)       page_slug                            │
│  module_config (JSONB)      block_type                           │
│  enabled                    block_config (JSONB)                 │
│                             enabled                              │
│                                                                  │
│  settings_history (versionshistorik för båda)                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CODE ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  src/types/modules.ts      ← Type definitions                   │
│  src/data/modules.ts       ← Supabase API calls                 │
│  src/models/modules.ts     ← React Query hooks                  │
│  src/components/admin/     ← Module settings UI                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Nästa steg

När planen är godkänd, börja med:

1. **Databasmigrering** - Skapa `modules`-tabellen
2. **TypeScript-typer** - `src/types/modules.ts`
3. **Data + Model layers** - `src/data/modules.ts` + `src/models/modules.ts`
4. **Migrera AI-modul** - Uppdatera komponenter att använda ny struktur

---

## Legacy-tabeller att fasa ut

| Tabell | Status | Åtgärd |
|--------|--------|--------|
| `ai_module` | Aktiv | Migrera → `modules`, sedan drop |
| `portfolio_settings` | Aktiv | Flytta till `modules.projects.module_config` |
| `chat_settings` | ✅ Borttagen | - |
| `quick_actions` | ✅ Borttagen | - |

---

*Senast uppdaterad: 2026-01-31*
