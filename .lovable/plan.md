
# Plan: Konfigurerbar AI för Admin-verktyg

## Bakgrund

Admin-panelen har tre AI-drivna funktioner som idag är hårdkodade mot Lovable AI:
1. **PromptEnhancer** - Förbättrar system prompts
2. **AITextActions** - Förbättrar/genererar text i blogg/sidor
3. **PageBuilderChat** - AI-sidbyggare

Vid self-hosting utan Lovable Cloud slutar dessa fungera.

## Lösning

Återanvänd den befintliga AI-integrationskonfigurationen från AI Module och låt edge functions välja provider baserat på admins val.

---

## Teknisk Implementation

### 1. Skapa delad AI Provider-logik (ny fil)

**Fil:** `supabase/functions/_shared/ai-provider.ts`

```text
┌─────────────────────────────────────────────────────────────────┐
│  AI Provider Utility                                            │
├─────────────────────────────────────────────────────────────────┤
│  • getAICompletion(messages, options)                           │
│  • Läser active_integration från modules-tabellen               │
│  • Stödjer: lovable, openai, gemini, n8n                        │
│  • Fallback: Lovable → Error om ingen nyckel finns              │
└─────────────────────────────────────────────────────────────────┘
```

Provider-logik:
- **lovable**: Använd `LOVABLE_API_KEY` (default i Lovable Cloud)
- **openai**: Använd `OPENAI_API_KEY` secret
- **gemini**: Använd `GEMINI_API_KEY` secret  
- **n8n**: Kalla webhook (befintlig logik)

### 2. Uppdatera Edge Functions

Alla tre funktioner uppdateras att använda den delade providern:

| Edge Function | Ändring |
|--------------|---------|
| `enhance-text` | Importera shared provider, läs config |
| `enhance-prompt` | Importera shared provider, läs config |
| `page-builder-chat` | Importera shared provider, läs config |

### 3. UI - Tydlig indikation

Lägg till en liten badge/notis i admin som visar vilken AI-provider som används för admin-verktyg:

```text
┌─────────────────────────────────────────┐
│  Persona & Instructions                 │
│  ────────────────────────────────────   │
│  System Prompt          [AI Assist ▾]   │
│  ┌─────────────────────────────────┐    │
│  │ Du är en hjälpsam assistent...  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ⓘ AI tools use: Lovable AI            │
│    (Configure in Integration section)   │
└─────────────────────────────────────────┘
```

---

## Implementation - Steg

### Steg 1: Skapa shared provider
- Ny fil: `supabase/functions/_shared/ai-provider.ts`
- Hämta modul-config från Supabase
- Route till rätt provider (Lovable/OpenAI/Gemini/n8n)
- Hantera saknade API-nycklar med tydliga felmeddelanden

### Steg 2: Migrera enhance-text
- Importera shared provider
- Ta bort hårdkodad Lovable-logik
- Behåll samma API-kontrakt

### Steg 3: Migrera enhance-prompt
- Samma som ovan

### Steg 4: Migrera page-builder-chat
- Samma som ovan (mer komplex pga tool-calling)

### Steg 5: UI-feedback
- Lägg till info-badge i AIModuleSettings
- Visa vilken provider som är aktiv för admin-verktyg

### Steg 6: Dokumentation
- Uppdatera DEPLOYMENT.md med info om vilka secrets som behövs vid self-hosting

---

## Alternativ som övervägdes

**A) Separata inställningar för admin-AI**
- Fördel: Mer flexibilitet
- Nackdel: Mer komplext, duplicerad konfiguration

**B) Hårdkoda fallback-kedja** (Lovable → OpenAI → Gemini)
- Fördel: "Just works"
- Nackdel: Svårare att förstå vilken som används

**Valt: Återanvänd befintlig integration-config** - enklast, minst kod, följer separation of concerns.

---

## Self-hosting krav efter implementation

För att AI-verktyg ska fungera vid self-hosting:

| Provider | Krav |
|----------|------|
| OpenAI | Sätt `OPENAI_API_KEY` secret |
| Gemini | Sätt `GEMINI_API_KEY` secret |
| n8n | Konfigurera webhook URL i admin |
| Lovable | Endast Lovable Cloud (automatiskt) |

---

## Tidsuppskattning

- Shared provider: ~30 min
- Migrera 3 edge functions: ~45 min
- UI-feedback: ~15 min
- Testning: ~15 min

**Totalt: ~2 timmar**
