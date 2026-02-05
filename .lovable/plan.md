
# Plan: Separat Admin AI Provider-inställning

## Bakgrund

Nuvarande implementation har ett problem:
- **Chat** kan använda n8n-webhook med tool calls (Telegram, e-post, etc.) - fungerar perfekt
- **Admin-verktyg** (PromptEnhancer, AITextActions, PageBuilderChat) läser samma `active_integration` och försöker anropa n8n-webhooken, som inte är designad för enkla text-operationer

## Lösning

Lägg till en **separat** inställning för admin-verktyg i AI-modulens config:

```text
┌─────────────────────────────────────────────────────────────────┐
│  AIModuleConfig                                                 │
├─────────────────────────────────────────────────────────────────┤
│  active_integration: 'n8n'        ← Chat (besökare)             │
│  integration: { webhook_url, ... }                              │
│                                                                 │
│  NEW: admin_ai_provider: 'lovable' | 'openai' | 'gemini' | 'n8n'│
│  NEW: admin_ai_config?: {                                       │
│         model?: string                                          │
│         webhook_url?: string  ← Om n8n valts, separat webhook   │
│       }                                                         │
└─────────────────────────────────────────────────────────────────┘
```

## Teknisk Implementation

### 1. Uppdatera TypeScript Types

**Fil:** `src/types/modules.ts`

Lägg till nya fält i `AIModuleConfig`:
- `admin_ai_provider: 'lovable' | 'openai' | 'gemini' | 'n8n'` - Default: `'lovable'`
- `admin_ai_config?: { model?: string; webhook_url?: string }` - Valfri konfiguration

### 2. Uppdatera Shared AI Provider

**Fil:** `supabase/functions/_shared/ai-provider.ts`

Ny funktion: `getAdminAICompletion()` som:
- Läser `admin_ai_provider` istället för `active_integration`
- Använder `admin_ai_config` för model/webhook_url
- Fallback till Lovable om inget är konfigurerat

### 3. Uppdatera Edge Functions

| Edge Function | Ändring |
|--------------|---------|
| `enhance-text` | Använd `getAdminAICompletion()` |
| `enhance-prompt` | Använd `getAdminAICompletion()` |
| `page-builder-chat` | Använd `getAdminAICompletion()` |

### 4. UI för Admin AI Provider

**Fil:** `src/components/admin/AIModuleSettings.tsx`

Lägg till nytt kort "Admin AI Tools" med:
- Dropdown för att välja provider (Lovable/OpenAI/Gemini/n8n)
- Om n8n väljs: input för separat webhook-URL
- Tydlig förklaring om skillnaden

```text
┌─────────────────────────────────────────┐
│  Admin AI Tools                         │
│  ────────────────────────────────────   │
│  Provider for in-app AI assistance      │
│                                         │
│  Provider:  [Lovable AI ▾]              │
│                                         │
│  ⓘ Used by: Prompt Enhancer,           │
│     Text Actions, Page Builder          │
│                                         │
│  Note: This is separate from visitor    │
│  chat which uses n8n with tool calls.   │
└─────────────────────────────────────────┘
```

### 5. Uppdatera Befintlig UI-indikator

Den badge som redan finns uppdateras att visa:
- "Admin AI tools use: **Lovable AI**" (eller vald provider)
- Länk till ny inställningssektion

---

## Implementation - Steg

1. **Types** - Lägg till `admin_ai_provider` och `admin_ai_config` i `AIModuleConfig`
2. **Default config** - Sätt `admin_ai_provider: 'lovable'` som default
3. **Shared provider** - Skapa `getAdminAICompletion()` funktion
4. **Edge functions** - Byt från `getAICompletion()` till `getAdminAICompletion()`
5. **UI** - Lägg till Admin AI Provider-kort i AIModuleSettings
6. **Deploy** - Deploya uppdaterade edge functions

---

## Provider-val för Admin

| Provider | Krav | Användningsfall |
|----------|------|-----------------|
| Lovable AI | Lovable Cloud | Default - fungerar direkt |
| OpenAI | `OPENAI_API_KEY` secret | Self-hosting |
| Gemini | `GEMINI_API_KEY` secret | Self-hosting |
| n8n | Separat webhook-URL | Avancerad - egen logik |

---

## Varför Inte Återanvända Chat-webhooken?

n8n-webhooken för chat är byggd för konversationer med:
- Tool calls (Telegram, e-post, sökningar)
- Session-hantering
- Komplex response-parsing

Admin-verktygen behöver enkla text-in/text-ut operationer, vilket inte matchar chat-webhookens design.

---

## Tidsuppskattning

- Types + defaults: ~10 min
- Shared provider: ~20 min  
- Edge functions: ~15 min
- UI: ~30 min
- Test: ~15 min

**Totalt: ~1.5 timmar**
