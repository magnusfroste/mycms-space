
# Plan: Omstrukturera Personal Branding-block

## Nuvarande Problem

**About Me-blocket** och **Expertise Grid-blocket** överlappar i funktion - båda försöker visa "skills" eller kompetenser, vilket skapar förvirring och duplicering.

```text
┌─────────────────────────────────────────────────────────┐
│ NUVARANDE STRUKTUR (överlappar)                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  About Split Block        Expertise Grid Block          │
│  ┌─────────────────┐      ┌─────────────────┐           │
│  │ • Profilbild    │      │ • Titel         │           │
│  │ • Intro text    │      │ • Icon-kort     │           │
│  │ • Skills pills  │ ←──→ │ • Beskrivning   │           │
│  │   (överlappar)  │      │   per item      │           │
│  └─────────────────┘      └─────────────────┘           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Ny Strategi: Tydlig Separation

```text
┌─────────────────────────────────────────────────────────┐
│ NY STRUKTUR (tydlig separation)                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  IDENTITET (Vem)          ERBJUDANDE (Vad)              │
│  ┌─────────────────┐      ┌─────────────────┐           │
│  │ About Me        │      │ Services Grid   │           │
│  │ • Profilbild    │      │ • Vad jag gör   │           │
│  │ • Min story     │      │ • Hur jag       │           │
│  │ • Social links  │      │   hjälper dig   │           │
│  │                 │      │ • Call-to-action│           │
│  └─────────────────┘      └─────────────────┘           │
│                                                         │
│  NYA BLOCK                                              │
│  ┌─────────────────┐      ┌─────────────────┐           │
│  │ Skills Bar      │      │ Values Block    │           │
│  │ • Tekniska      │      │ • Core beliefs  │           │
│  │   kunskaper     │      │ • Arbetssätt    │           │
│  │ • Progress bars │      │ • 3-4 värden    │           │
│  └─────────────────┘      └─────────────────┘           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Fas 1: Rensa About Me-blocket

**Mål:** About Me blir en ren "person-story" utan skills-lista.

**Ändringar:**

| Fil | Åtgärd |
|-----|--------|
| `AboutSplitBlock.tsx` | Ta bort skills-rendereingen helt |
| `EditableAboutSplitBlock.tsx` | Ta bort skills från editable vy |
| `AboutSplitBlockConfig` | Behåll skills-typen för bakåtkompatibilitet men markera som deprecated |
| `blockDefaults.ts` | Ta bort skills från default config |

**Ny struktur för About Me:**
- Profilbild (befintlig)
- Intro text (befintlig) 
- Additional text (befintlig)
- **NYTT:** Social links (array med icon + URL)

---

## Fas 2: Omvandla Expertise Grid → Services Block

**Mål:** Byt fokus från "vad jag kan" till "vad jag erbjuder dig".

**Ändringar:**

| Fil | Åtgärd |
|-----|--------|
| `ExpertiseGridBlock.tsx` | Lägg till optional CTA-knapp per item, lägg till `show_cta` toggle |
| `ExpertiseGridBlockConfig` | Utöka items med `cta_text` och `cta_link` |
| `ExpertiseAreaEditor.tsx` | Lägg till fält för CTA per item |
| `BlockLibraryPanel.tsx` | Uppdatera beskrivning: "Services & expertise areas" |

**Ny item-struktur:**
```typescript
{
  id: string;
  title: string;
  description: string;
  icon: string;
  cta_text?: string;    // NYTT: "Läs mer", "Boka möte"
  cta_link?: string;    // NYTT: URL eller anchor
  enabled: boolean;
  order_index: number;
}
```

---

## Fas 3: Nytt Skills Bar-block (optional)

**Mål:** Ett dedikerat block för tekniska skills med progress bars.

**Ny fil:** `src/components/blocks/SkillsBarBlock.tsx`

**Config:**
```typescript
interface SkillsBarBlockConfig {
  title?: string;
  subtitle?: string;
  skills?: Array<{
    id: string;
    name: string;
    level: number;      // 0-100
    category?: string;  // "Frontend", "Backend", etc.
    enabled: boolean;
  }>;
  layout?: 'bars' | 'tags' | 'compact';
}
```

**Nytt editor:** `src/components/admin/block-editor/SkillsBarEditor.tsx`

---

## Fas 4: Nytt Values Block (optional)

**Mål:** Ett block för att visa personliga värderingar/filosofi.

**Ny fil:** `src/components/blocks/ValuesBlock.tsx`

**Config:**
```typescript
interface ValuesBlockConfig {
  title?: string;
  subtitle?: string;
  values?: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    enabled: boolean;
  }>;
  layout?: 'grid' | 'list' | 'cards';
}
```

**Designidé:** 3-4 stora kort med ikoner, kort text, hover-effekt. Minimalistiskt.

---

## Fas 5: Social Links för About Me

**Mål:** Lägg till social links direkt i About-blocket.

**Utöka AboutSplitBlockConfig:**
```typescript
interface AboutSplitBlockConfig {
  // ... befintliga fält
  social_links?: Array<{
    platform: 'linkedin' | 'github' | 'twitter' | 'website' | 'email';
    url: string;
    enabled: boolean;
  }>;
}
```

**Rendering:** Ikoner under profilbilden eller efter texten.

---

## Uppdaterad Block Library

```text
Content (uppdaterad)
├── Text Section
├── Image & Text
└── About Me ← Rensat, person-fokus

Features & Grid (uppdaterad)
├── Services Grid ← Omdöpt från Expertise Grid
├── Skills Bar ← NY
├── Values ← NY
├── Bento Grid
└── Stats Counter
```

---

## Technical Details

### Filer som ändras

| Kategori | Filer |
|----------|-------|
| **Block Components** | `AboutSplitBlock.tsx`, `ExpertiseGridBlock.tsx` |
| **Editable Blocks** | `EditableAboutSplitBlock.tsx` |
| **Block Editors** | `ExpertiseAreaEditor.tsx`, `SkillListEditor.tsx` (ta bort) |
| **Types** | `blockConfigs.ts` |
| **Defaults** | `blockDefaults.ts` |
| **Library** | `BlockLibraryPanel.tsx` |

### Nya filer (Fas 3-4)

```text
src/components/blocks/
├── SkillsBarBlock.tsx          (ny)
└── ValuesBlock.tsx             (ny)

src/components/admin/block-editor/
├── SkillsBarEditor.tsx         (ny)
└── ValuesEditor.tsx            (ny)

src/components/admin/editable-blocks/
├── EditableSkillsBarBlock.tsx  (ny, optional)
└── EditableValuesBlock.tsx     (ny, optional)
```

### Block Renderer-uppdatering

Lägg till nya cases i `BlockRenderer.tsx`:
```typescript
case 'skills-bar':
  return <SkillsBarBlock config={block.block_config} />;
case 'values':
  return <ValuesBlock config={block.block_config} />;
```

---

## Prioritetsordning

| Prio | Åtgärd | Värde |
|------|--------|-------|
| 1 | Rensa About Me (ta bort skills) | Hög - löser överlappning |
| 2 | Förbättra Expertise Grid med CTA | Hög - ökar användbarhet |
| 3 | Lägg till Social Links i About | Medium - vanlig request |
| 4 | Skills Bar Block | Medium - för tekniska profiler |
| 5 | Values Block | Låg - nice-to-have |

---

## Summering

**Enkel version (Fas 1-2):**
- About Me → Ren personlig story + social links
- Expertise Grid → Services med CTAs

**Full version (Fas 1-5):**
- Plus dedikerade Skills Bar och Values-block

Detta ger användare tydliga val utan att skapa 200 inställningar, och följer "less is more"-principen.
