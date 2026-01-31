
# Refaktorering till Modulär JSONB-baserad Datalagring

## Problemanalys

Din nuvarande arkitektur har data fragmenterad över **11 olika tabeller**:
- `hero_settings` - Hero-blockdata
- `about_me_settings` - About-blockdata  
- `expertise_areas` - Expertise-items (lista)
- `featured_in` - Featured-items (lista)
- `projects` + `project_images` + `project_categories` - Projektdata
- `quick_actions` - Chat quick actions
- `chat_settings` - Chat-konfiguration
- `portfolio_settings` - Portfolio-konfiguration
- `nav_links` - Navigation

Detta gör det:
- Svårt att lägga till nya blocktyper utan schema-ändringar
- Komplicerat för AI att skapa innehåll (måste känna till varje tabell)
- Fragmenterat för versionshistorik

## Föreslagen Lösning

Flytta all blockdata **in i `page_blocks.block_config`** JSONB-kolumnen, samtidigt som vi behåller befintlig data.

### Ny Datastruktur

```text
┌─────────────────────────────────────────────────────────────────┐
│                        page_blocks                               │
├─────────────────────────────────────────────────────────────────┤
│ id          │ page_slug │ block_type │ block_config (JSONB)     │
├─────────────┼───────────┼────────────┼──────────────────────────┤
│ uuid        │ "home"    │ "hero"     │ {                        │
│             │           │            │   "name": "Magnus...",   │
│             │           │            │   "tagline": "...",      │
│             │           │            │   "features": [...]      │
│             │           │            │ }                        │
├─────────────┼───────────┼────────────┼──────────────────────────┤
│ uuid        │ "home"    │ "about"    │ {                        │
│             │           │            │   "name": "...",         │
│             │           │            │   "intro_text": "...",   │
│             │           │            │   "skills": [...]        │
│             │           │            │ }                        │
├─────────────┼───────────┼────────────┼──────────────────────────┤
│ uuid        │ "home"    │ "projects" │ {                        │
│             │           │            │   "title": "...",        │
│             │           │            │   "projects": [          │
│             │           │            │     { title, desc, ... } │
│             │           │            │   ]                      │
│             │           │            │ }                        │
└─────────────────────────────────────────────────────────────────┘
```

### Fördelar

1. **En tabell för all blockdata** - Enklare att förstå och hantera
2. **Flexibla attribut** - Nya fält kan läggas till utan migrationer
3. **Enkel versionshistorik** - En trigger på `page_blocks` hanterar allt
4. **AI-vänligt** - AI kan uppdatera ett block genom att skicka ny JSONB
5. **Befintlig data bevaras** - Migrerar existerande data automatiskt

---

## Implementationsplan

### Fas 1: Datamigrering (Steg 1-3)

**Steg 1: Migrera befintlig data till JSONB**
- Skapa en SQL-migration som kopierar data från gamla tabeller till `block_config`
- Hero-data → hero-blockets `block_config`
- About-data → about-blockets `block_config`
- Expertise-items → expertise-blockets `block_config.items[]`
- Featured-items → featured-blockets `block_config.items[]`
- Projekt → project-blockets `block_config.projects[]`
- Quick actions → chat-blockets `block_config.quick_actions[]`

**Steg 2: Uppdatera versionshistorik**
- Lägg till trigger på `page_blocks` för att logga ändringar i `settings_history`
- Ta bort triggers från de gamla tabellerna (valfritt, efter verifiering)

**Steg 3: Behåll globala inställningar separat**
- `chat_settings` (webhook_url) - Global, inte per-block
- `nav_links` - Global navigation, inte per-block
- `portfolio_settings` - Kan bli en del av project-block config

### Fas 2: Uppdatera Model-lagret (Steg 4-5)

**Steg 4: Skapa ny unified model**
- Ny fil: `src/models/blockContent.ts`
- Hook: `useBlockContent(blockId)` - Hämtar och uppdaterar ett blocks data
- Hook: `useUpdateBlockContent()` - Uppdaterar `block_config`
- Typade konfigurationer per blocktyp

**Steg 5: Uppdatera existerande hooks**
- `useHeroSettings` → Läser från block_config istället
- `useAboutMeSettings` → Läser från block_config istället  
- `useExpertiseAreas` → Läser från block_config.items
- Etc.

### Fas 3: Uppdatera Komponentlagret (Steg 6-7)

**Steg 6: Uppdatera Block-komponenter**
- `HeroBlock` - Använder data direkt från `config` prop istället för hook
- `AboutSplitBlock` - Använder data direkt från `config` prop
- `ExpertiseGridBlock` - Renderar `config.items[]` direkt
- Etc.

**Steg 7: Uppdatera Admin-editorer**
- `InlineBlockEditor` - Uppdaterar `block_config` direkt
- Ta bort separata uppdateringslogik för hero/about/etc
- Enhetlig save-logik för alla blocktyper

### Fas 4: Cleanup (Steg 8)

**Steg 8: Arkivera gamla tabeller**
- Behåll gamla tabeller som backup (döp om till `_archive_*`)
- Ta bort gamla models/hooks som inte längre används
- Uppdatera dokumentation

---

## Tekniska Detaljer

### Migrerings-SQL (exempel)

```sql
-- Migrera hero_settings till hero-blockets block_config
UPDATE page_blocks pb
SET block_config = (
  SELECT jsonb_build_object(
    'name', hs.name,
    'tagline', hs.tagline,
    'features', jsonb_build_array(
      jsonb_build_object('text', hs.feature1, 'icon', hs.feature1_icon),
      jsonb_build_object('text', hs.feature2, 'icon', hs.feature2_icon),
      jsonb_build_object('text', hs.feature3, 'icon', hs.feature3_icon)
    ),
    'enable_animations', hs.enable_animations,
    'animation_style', hs.animation_style
  )
  FROM hero_settings hs
  LIMIT 1
)
WHERE pb.block_type = 'hero';
```

### Ny TypeScript-struktur

```typescript
// src/types/blockConfigs.ts
interface HeroBlockConfig {
  name: string;
  tagline: string;
  features: Array<{ text: string; icon: string }>;
  enable_animations: boolean;
  animation_style: 'falling-stars' | 'particles' | 'gradient-shift';
}

interface AboutBlockConfig {
  name: string;
  intro_text: string;
  additional_text: string;
  image_url?: string;
  skills: Array<{ title: string; description: string; icon: string }>;
}

interface ProjectShowcaseConfig {
  section_title?: string;
  section_subtitle?: string;
  projects: Array<{
    id: string;
    title: string;
    description: string;
    demo_link: string;
    images: Array<{ url: string; order: number }>;
    categories: string[];
  }>;
  categories: Array<{ id: string; name: string; slug: string }>;
}

// Union type för alla blockconfigs
type BlockConfig = 
  | { type: 'hero'; config: HeroBlockConfig }
  | { type: 'about-split'; config: AboutBlockConfig }
  | { type: 'project-showcase'; config: ProjectShowcaseConfig }
  // ... etc
```

### AI-integration

Med denna struktur kan Page Builder Chat enkelt:
1. Hämta ett block: `SELECT block_config FROM page_blocks WHERE id = ?`
2. Uppdatera innehåll: `UPDATE page_blocks SET block_config = ? WHERE id = ?`
3. Lägga till items: `UPDATE page_blocks SET block_config = jsonb_set(block_config, '{projects}', ...)`

---

## Risker och Mitigation

| Risk | Mitigation |
|------|------------|
| Datatransformering kan misslyckas | Kör migrering i testmiljö först, behåll backup |
| Prestanda med stora JSONB | Indexera viktiga JSON-paths om nödvändigt |
| Befintliga hooks slutar fungera | Gradvis migration, hooks läser från nya platsen |

---

## Tidsuppskattning

- **Fas 1** (Datamigrering): ~2-3 timmar
- **Fas 2** (Model-lager): ~2-3 timmar  
- **Fas 3** (Komponenter): ~3-4 timmar
- **Fas 4** (Cleanup): ~1 timme

**Total: 8-11 timmar** av utvecklingsarbete

---

## Nästa Steg

Om du godkänner denna plan börjar jag med:

1. Skapa migrerings-SQL som kopierar all befintlig data till `block_config`
2. Verifiera att Magnus Frostes data bevaras korrekt
3. Uppdatera block-komponenter att läsa från config istället för separata hooks
