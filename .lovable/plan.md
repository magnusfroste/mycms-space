

# Modulär Systemprompt-arkitektur

## Vision

Istället för att hårdkoda varje kontext-källa i edge function skapar vi ett **plugin-mönster** där varje modul registrerar sin egen kontext-builder. Detta gör systemet helt skalbart för framtida moduler.

---

## Nuläge vs. Föreslaget

### Nuläge (hårdkodat)
```
Edge Function:
├── if (repos) → GitHub-sektion (hårdkodat)
├── if (pages) → Pages-sektion (hårdkodat)
├── if (blogs) → Blog-sektion (hårdkodat)
└── Varje ny modul kräver kodändring
```

### Föreslaget (modulärt)
```
Varje modul definierar:
├── contextKey: "repos" | "pages" | "blogs" | "products" | ...
├── promptSection: "## GitHub Projects\n..."
└── buildContext(): → data för AI

Edge Function:
└── Loopar genom alla sektioner dynamiskt
```

---

## Teknisk implementation

### Steg 1: Context Section Interface
```typescript
// types/modules.ts - ny interface

export interface AIContextSection {
  key: string;           // "github", "pages", "blogs", etc.
  title: string;         // "GitHub Projects"
  instruction: string;   // "Use this to answer questions about..."
  enabled: boolean;      // Från modulens config
}
```

### Steg 2: Modul-specifika kontext-builders

Varje modul som kan bidra med AI-kontext får en `buildAIContext()` funktion:

```typescript
// hooks/useAIChatContext.ts

// Registry för kontext-sektioner
const contextBuilders: Record<string, ContextBuilder> = {
  github: {
    title: '## GitHub Projects',
    instruction: `You have knowledge about Magnus's GitHub projects. 
Use this to answer questions about his technical work, coding skills, and project experience.`,
    getData: (repos) => repos.map(r => 
      `**${r.name}**: ${r.description}\n` +
      (r.problemStatement ? `Problem: ${r.problemStatement}\n` : '') +
      (r.whyItMatters ? `Why: ${r.whyItMatters}\n` : '')
    ).join('\n'),
  },
  
  pages: {
    title: '## Website Content',
    instruction: `You have access to content from the website. 
Use this to provide accurate information about Magnus and his services.`,
    getData: (pages) => pages.map(p => 
      `**${p.title}** (/${p.slug})\n${p.content}`
    ).join('\n\n'),
  },
  
  blogs: {
    title: '## Blog Posts',
    instruction: `You have access to Magnus's blog posts. 
Use these to discuss his thoughts, expertise, and insights.`,
    getData: (blogs) => blogs.map(b => 
      `**${b.title}**\n${b.excerpt || b.content.substring(0, 300)}...`
    ).join('\n\n'),
  },
  
  // FRAMTIDA MODULER:
  // products: { ... }
  // services: { ... }
  // testimonials: { ... }
};
```

### Steg 3: Dynamisk prompt-byggning

Edge Function bygger prompten genom att loopa:

```typescript
// supabase/functions/ai-chat/index.ts

function buildDynamicPrompt(
  basePrompt: string, 
  siteContext: SiteContext | null
): string {
  if (!siteContext) return basePrompt;

  const sections: string[] = [];
  
  // Dynamiskt: för varje kontext-typ som har data
  const contextTypes = [
    { key: 'repos', data: siteContext.repos, title: 'GitHub Projects', 
      instruction: 'Use this to discuss technical projects and skills.' },
    { key: 'pages', data: siteContext.pages, title: 'Website Content',
      instruction: 'Use this for accurate info about Magnus.' },
    { key: 'blogs', data: siteContext.blogs, title: 'Blog Posts',
      instruction: 'Use these for thoughts and expertise.' },
  ];
  
  for (const ctx of contextTypes) {
    if (ctx.data && ctx.data.length > 0) {
      sections.push(`\n\n## ${ctx.title}\n${ctx.instruction}\n`);
      // Lägg till formaterad data...
    }
  }
  
  // Logga för debugging
  console.log(`[AI] Prompt built with ${sections.length} context section(s)`);
  
  return basePrompt + sections.join('');
}
```

---

## Implementationsplan

### Fas 1: Fixa GitHub-sparing (bugfix)
- Säkerställ att `include_github_context` och `selected_repo_ids` sparas korrekt i `AIModuleSettings.tsx`
- Bekräfta med databasfråga

### Fas 2: Centralisera prompt-byggning
- Flytta ALL kontext-logik till Edge Function
- Ta bort `contextInstruction` från `useAIChatContext.ts` (duplicering)
- Frontend skickar bara rå `siteContext`

### Fas 3: Förbättra Edge Function
- Uppdatera `buildSystemPrompt()` med tydlig dynamisk loop
- Lägg till bättre loggning: vilka sektioner, hur mycket data
- Separera personlighet från kontext med tydliga rubriker

### Fas 4: Synlig feedback (bonus)
- Visa i admin vilka kontext-källor som är aktiva
- "Active sources: GitHub (5 repos), Pages (3), Blog (2)"

---

## Dataflöde

```
┌─────────────────────────────────────────────────────────────┐
│  AI Module Settings (Admin)                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ ☑ GitHub    │ │ ☑ Pages     │ │ ☐ Blog      │            │
│  │ 5 selected  │ │ 3 selected  │ │ 0 selected  │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  useAIChatContext                                           │
│  Returnerar:                                                │
│  {                                                          │
│    contextData: { repos: [...], pages: [...], blogs: [] }   │
│    contextSummary: "5 repos, 3 pages"                       │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Edge Function: buildDynamicPrompt()                        │
│                                                             │
│  [Base Prompt - Personlighet]                               │
│  You are Magnet, an AI twin of Magnus...                   │
│                                                             │
│  [Dynamiskt tillagda sektioner]                            │
│  ## GitHub Projects                                        │
│  You have knowledge about 5 projects...                    │
│  **Flowwink**: Lightweight flashcard app...                │
│                                                             │
│  ## Website Content                                        │
│  You have access to 3 pages...                             │
│                                                             │
│  (Blog-sektion utelämnas - ingen data)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Framtida skalbarhet

Med denna arkitektur kan vi enkelt lägga till nya kontext-källor:

| Framtida modul | contextKey | Data |
|----------------|------------|------|
| Products | `products` | Produkter/tjänster |
| Testimonials | `testimonials` | Kundcitat |
| CV/Resume | `resume` | Arbetslivserfarenhet |
| Courses | `courses` | Kurser/utbildningar |

Varje ny modul:
1. Definierar sin `AIContextSection`
2. Lägger till toggle i AI Module Settings
3. Edge Function loopar automatiskt genom alla

---

## Förväntade filer att ändra

1. `src/components/admin/AIModuleSettings.tsx` - fixa spara-logik
2. `src/hooks/useAIChatContext.ts` - ta bort `contextInstruction`
3. `supabase/functions/ai-chat/index.ts` - förbättra `buildSystemPrompt()`
4. Deploy edge function

