
# AI Chat Modul - Konsolidering och Modularisering ✅ IMPLEMENTERAD

## Nuläge

Idag är chat-relaterade inställningar fragmenterade över:

```text
┌─────────────────────────────────────────────────────────────────┐
│                    NUVARANDE STRUKTUR                            │
├─────────────────────────────────────────────────────────────────┤
│  Admin-meny "Chat"                                               │
│  └── ChatTextSettings → chat_settings.initial_placeholder       │
│  └── ChatTextSettings → chat_settings.active_placeholder        │
│  └── QuickActionsManager → quick_actions-tabell                 │
│                                                                  │
│  Admin-meny "Webhook"                                            │
│  └── WebhookSettings → chat_settings.webhook_url                │
│                                                                  │
│  ChatWidgetBlock (block_config)                                  │
│  └── quick_actions[] (ej synkade med quick_actions-tabellen)    │
│  └── title, subtitle, show_quick_actions                        │
│                                                                  │
│  AppleChat.tsx                                                   │
│  └── Läser från chat_settings (global)                          │
│  └── Läser från quick_actions-tabell (global)                   │
│  └── IGNORERAR block_config helt!                               │
└─────────────────────────────────────────────────────────────────┘
```

### Problem

1. **Två menyval** i admin (Chat + Webhook) för samma sak
2. **Quick actions** finns i både `quick_actions`-tabell OCH `block_config`
3. **AppleChat** läser från fel ställe (gamla tabeller istället för block_config)
4. **Ingen modulär design** - svårt att aktivera/inaktivera chat-funktionalitet

---

## Ny Modell: AI Chat Modul

```text
┌─────────────────────────────────────────────────────────────────┐
│                        AI MODUL                                  │
│                   (Global konfiguration)                         │
├─────────────────────────────────────────────────────────────────┤
│  Tekniska inställningar (kräver aldrig per-block anpassning)    │
│  ├── enabled: boolean           ← Aktivera/inaktivera modulen   │
│  ├── webhook_url: string        ← n8n/AI webhook                │
│  ├── ai_provider: string        ← Framtida: val av AI-modell    │
│  └── rate_limit: number         ← Framtida: begränsningar       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CHAT WIDGET BLOCK                             │
│              (Per-block i page_blocks.block_config)              │
├─────────────────────────────────────────────────────────────────┤
│  Innehåll och presentation (unikt per block-instans)            │
│  ├── title: string              ← Rubrik ovanför chatten        │
│  ├── subtitle: string           ← Underrubrik                   │
│  ├── initial_placeholder        ← Välkomstmeddelande            │
│  ├── active_placeholder         ← Placeholder under konvo       │
│  ├── show_quick_actions         ← Visa snabbknappar             │
│  └── quick_actions[]            ← Per-block snabbknappar        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementationsplan

### Fas 1: Skapa ny modul-tabell

**Steg 1: Databasmigrering**
- Skapa `ai_module`-tabell för globala AI-inställningar
- Migrera `webhook_url` från `chat_settings`
- Lägg till `enabled`-flagga för att aktivera/inaktivera modulen

```sql
CREATE TABLE ai_module (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN DEFAULT true,
  webhook_url TEXT NOT NULL,
  provider TEXT DEFAULT 'n8n',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Migrera befintlig webhook_url
INSERT INTO ai_module (webhook_url)
SELECT webhook_url FROM chat_settings LIMIT 1;
```

### Fas 2: Flytta placeholders till block_config

**Steg 2: Migrera chat-inställningar till block**
- Uppdatera befintliga chat-widget block med `initial_placeholder` och `active_placeholder`
- Migrera `quick_actions` från tabellen till varje chat-widget blocks config

```sql
-- Migrera placeholders från chat_settings till chat-widget block
UPDATE page_blocks pb
SET block_config = jsonb_set(
  jsonb_set(
    pb.block_config,
    '{initial_placeholder}',
    to_jsonb((SELECT initial_placeholder FROM chat_settings LIMIT 1))
  ),
  '{active_placeholder}',
  to_jsonb((SELECT active_placeholder FROM chat_settings LIMIT 1))
)
WHERE pb.block_type = 'chat-widget';

-- Migrera quick_actions till block_config
UPDATE page_blocks pb
SET block_config = jsonb_set(
  pb.block_config,
  '{quick_actions}',
  (SELECT jsonb_agg(...) FROM quick_actions WHERE enabled = true)
)
WHERE pb.block_type = 'chat-widget';
```

### Fas 3: Konsolidera admin-UI

**Steg 3: Skapa AIModuleSettings-komponent**
- Ny komponent: `src/components/admin/AIModuleSettings.tsx`
- Innehåller:
  - Modulens on/off-switch
  - Webhook URL-konfiguration
  - Framtida: AI-provider val

**Steg 4: Uppdatera AdminSidebar**
- Ta bort "Chat" och "Webhook" från menyn
- Lägg till "AI Modul" under Inställningar
- Flytta "Chat"-specifik konfiguration till block-editorn

```typescript
// Före
const settingsNavItems = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'webhook', label: 'Webhook', icon: Webhook },
  { id: 'history', label: 'Historik', icon: History },
];

// Efter
const settingsNavItems = [
  { id: 'ai-module', label: 'AI Modul', icon: Bot },
  { id: 'history', label: 'Historik', icon: History },
];
```

### Fas 4: Uppdatera ChatWidgetBlock och AppleChat

**Steg 5: Uppdatera ChatWidgetBlock**
- Läsa `initial_placeholder` och `active_placeholder` från `config`
- Läsa `quick_actions` från `config.quick_actions[]`
- Hämta `webhook_url` från `ai_module` via ny hook

**Steg 6: Uppdatera AppleChat**
- Ta bort `useChatSettings()`-hook
- Ta bort `useQuickActions()`-hook
- Ta emot allt som props från ChatWidgetBlock

```typescript
// Före (AppleChat)
const { data: settings } = useChatSettings();
const { data: quickActionsData } = useQuickActions();
const webhookUrl = settings?.webhook_url || propWebhookUrl;

// Efter (AppleChat)
interface AppleChatProps {
  webhookUrl: string;
  initialPlaceholder: string;
  activePlaceholder: string;
  quickActions: QuickAction[];
  // ...
}
```

### Fas 5: Uppdatera block-editor

**Steg 7: Förbättra ChatWidgetEditor**
- Inline-redigering av placeholders
- Inline-redigering av quick actions (redan påbörjat i `QuickActionsList`)
- Ingen koppling till externa tabeller

---

## Ny Admin-struktur

```text
┌─────────────────────────────────────────────────────────────────┐
│  ADMIN SIDEBAR                                                   │
├─────────────────────────────────────────────────────────────────┤
│  Huvudmeny                                                       │
│  ├── Dashboard                                                   │
│  ├── Sidor                                                       │
│  ├── Sidbyggare  ← Redigera chat-widget blocks inline           │
│  ├── Navigation                                                  │
│  └── Meddelanden                                                 │
│                                                                  │
│  Moduler                                                         │
│  └── AI Modul    ← Webhook + on/off + framtida provider         │
│                                                                  │
│  System                                                          │
│  └── Historik                                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tekniska Detaljer

### Ny TypeScript-typ

```typescript
// src/types/index.ts
export interface AIModuleSettings {
  id: string;
  enabled: boolean;
  webhook_url: string;
  provider: 'n8n' | 'custom';
  created_at?: string;
  updated_at?: string;
}
```

### Ny Hook

```typescript
// src/models/aiModule.ts
export const useAIModule = () => {
  return useQuery({
    queryKey: ['ai-module'],
    queryFn: fetchAIModuleSettings,
  });
};

export const useUpdateAIModule = () => {
  return useMutation({
    mutationFn: updateAIModuleSettings,
    onSuccess: () => queryClient.invalidateQueries(['ai-module']),
  });
};
```

### Uppdaterad ChatWidgetBlockConfig

```typescript
// src/types/blockConfigs.ts
export interface ChatWidgetBlockConfig {
  title?: string;
  subtitle?: string;
  initial_placeholder?: string;  // ← NY
  active_placeholder?: string;   // ← NY
  show_quick_actions?: boolean;
  quick_actions?: Array<{
    id: string;
    label: string;
    message: string;
    icon: string;
    order_index: number;
    enabled: boolean;
  }>;
}
```

---

## Dataflöde efter refaktorering

```text
┌─────────────────┐      ┌─────────────────┐
│  ai_module      │      │  page_blocks    │
│  ───────────    │      │  ───────────    │
│  webhook_url    │      │  block_config   │
│  enabled        │      │  ├── title      │
│  provider       │      │  ├── subtitle   │
└────────┬────────┘      │  ├── placeholders│
         │               │  └── quick_actions│
         │               └────────┬────────┘
         │                        │
         ▼                        ▼
    ┌─────────────────────────────────────┐
    │           ChatWidgetBlock           │
    │  ─────────────────────────────────  │
    │  const { data: aiModule } = useAIModule()  │
    │  const config = block.block_config  │
    └─────────────────────┬───────────────┘
                          │
                          ▼
    ┌─────────────────────────────────────┐
    │            AppleChat                │
    │  ─────────────────────────────────  │
    │  webhookUrl={aiModule.webhook_url}  │
    │  placeholders={config...}           │
    │  quickActions={config.quick_actions}│
    └─────────────────────────────────────┘
```

---

## Sammanfattning

| Före | Efter |
|------|-------|
| 2 menyval (Chat + Webhook) | 1 menyval (AI Modul) |
| `chat_settings`-tabell | `ai_module`-tabell (endast tekniskt) |
| `quick_actions`-tabell | Inbäddat i `block_config.quick_actions[]` |
| Placeholders globala | Placeholders per chat-widget block |
| AppleChat läser från 3 källor | AppleChat tar emot allt som props |

---

## Nästa Steg (efter godkännande)

1. Skapa `ai_module`-tabell och migrera webhook_url
2. Migrera placeholders + quick_actions till chat-widget block_config
3. Skapa `AIModuleSettings.tsx`-komponent
4. Uppdatera `AdminSidebar` med ny struktur
5. Refaktorera `ChatWidgetBlock` och `AppleChat`
6. Ta bort legacy-tabeller (`chat_settings`, `quick_actions`) eller arkivera
