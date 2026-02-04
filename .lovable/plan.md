

# Chat-block förslag: Två alternativa vägar

## Nulägesanalys

### Vad finns idag
```
+------------------+     +-------------------+     +-------------------+
|    HeroBlock     |     | ChatWidgetBlock   |     |   ChatLanding     |
|------------------|     |-------------------|     |-------------------|
| - name           |     | - title           |     | - title           |
| - tagline        |     | - subtitle        |     | - subtitle        |
| - features       |     | - initial_placeholder  | (duplicerar logik)|
| - animations     |     | - active_placeholder   |                    |
| - scroll → #chat |     | - quick_actions   |     |                    |
+------------------+     +-------------------+     +-------------------+
```

### Identifierade problem
1. **Redundans**: Title/subtitle i ChatWidgetBlock överlappas av HeroBlock
2. **Tom "ruta"**: `ChatMessageList` renderar en `h-80 glass-card` container även utan meddelanden
3. **Oanvänd komponent**: `ChatLanding.tsx` duplicerar exakt samma logik som `ChatWidgetBlock`
4. **Förvirrande konfiguration**: Flera placeholder-texter som inte syns tydligt

---

## Alternativ A: Förenklat Chat-block

**Koncept**: Slimmar ner chat-blocket till sin kärnfunktion – ett enkelt chattinput som förlitar sig på Hero för introduktion.

### Vad vi tar bort
- `title` och `subtitle` (Hero täcker detta)
- `initial_placeholder` (visar bara `active_placeholder`)
- Tom "ruta" före första meddelandet

### Resulterande struktur
```
+------------------+
|    HeroBlock     |  ← Namn, tagline, features, animationer
+------------------+
        ↓
+------------------+
| Minimal Chat     |  ← Bara input + quick actions
| (ingen tom ruta) |
+------------------+
```

### Konfiguration i admin
- `active_placeholder` (texten i input-fältet)
- `show_quick_actions` + `quick_actions[]`

### Fördelar
- Renare separation av concerns
- Mindre att konfigurera
- Snabbare laddning utan onödig container

---

## Alternativ B: Chat Hero Block (ny blocktyp)

**Koncept**: Slår ihop Hero + Chat till ett nytt immersivt "Chat Hero"-block där konversationen är fokuspunkten.

### Design
```
+------------------------------------------------+
|                                                |
|        ✨ [animerad bakgrund] ✨               |
|                                                |
|           "Hi, I'm Magnet"                     |
|        Magnus digital twin                     |
|                                                |
|   +--------------------------------------+     |
|   | [chat input med glassmorphism]       |     |
|   +--------------------------------------+     |
|                                                |
|      [quick action] [quick action]            |
|                                                |
+------------------------------------------------+
```

### Ny konfiguration
```typescript
interface ChatHeroBlockConfig {
  // Identity
  agent_name?: string;      // "Magnet"
  agent_tagline?: string;   // "Magnus digital twin"
  
  // Visual
  enable_animations?: boolean;
  animation_style?: 'falling-stars' | 'particles' | 'gradient-shift';
  
  // Chat
  placeholder?: string;
  show_quick_actions?: boolean;
  quick_actions?: QuickActionConfig[];
}
```

### Fördelar
- Konversationen blir "första intrycket"
- Ett block att konfigurera istället för två
- Perfekt för agentfokuserade landningssidor
- Passar din vision om "Agentic Web"

---

## Rekommendation

**Jag rekommenderar Alternativ B (Chat Hero)** av följande skäl:

1. **Visionen**: Din roadmap pekar mot "Digital Twin" och "Agent Discovery" – ett dedikerat Chat Hero-block förstärker denna identitet
2. **First Impression**: Besökaren möter direkt agenten, inte en statisk hero + scroll
3. **Förenkling**: Ett block att konfigurera istället för att koordinera två
4. **Flexibilitet**: Du kan fortfarande använda vanligt HeroBlock på andra sidor

### Implementationsplan

**Fas 1: Skapa ChatHeroBlock**
1. Ny komponent `src/components/blocks/ChatHeroBlock.tsx`
2. Kombinerar Hero-visuella (mesh gradient, parallax, noise) med ChatInterface
3. Ny typ i `blockConfigs.ts`

**Fas 2: Admin Editor**
1. Ny editor `ChatHeroEditor.tsx`
2. Kombinerar hero-fält (agent_name, tagline, animations) med chat-fält (placeholder, quick_actions)

**Fas 3: Städa upp**
1. Ta bort `ChatLanding.tsx` (oanvänd)
2. Behåll `ChatWidgetBlock` för användning längre ner på sidor (t.ex. kontaktsektion)
3. Uppdatera `/home`-sidan att använda nya `chat-hero` istället för `hero` + `chat-widget`

---

## Tekniska detaljer

### Ny blocktyp-registrering
```typescript
// types/blockConfigs.ts
export interface ChatHeroBlockConfig {
  agent_name?: string;
  agent_tagline?: string;
  welcome_badge?: string;         // "Welcome" badge text
  enable_animations?: boolean;
  animation_style?: 'falling-stars' | 'particles' | 'gradient-shift';
  placeholder?: string;
  show_quick_actions?: boolean;
  quick_actions?: QuickActionConfig[];
}
```

### ChatHeroBlock-struktur
```tsx
<section className="relative min-h-[90vh] flex items-center">
  {/* Mesh gradient + noise + animations (från HeroBlock) */}
  
  <div className="container">
    <div className="max-w-3xl mx-auto text-center">
      {/* Badge */}
      <div className="badge">Welcome</div>
      
      {/* Agent identity */}
      <h1>{agent_name}</h1>
      <p>{agent_tagline}</p>
      
      {/* Chat input (inga meddelanden visas här) */}
      <ChatInput ... />
      
      {/* Quick actions */}
      <ChatQuickActions ... />
    </div>
  </div>
</section>
```

### Navigeringsbeteende (behålls)
När användaren skickar första meddelandet → navigera till `/chat` med state

---

## Sammanfattning

| Aspekt | Alt A: Förenklat | Alt B: Chat Hero |
|--------|------------------|------------------|
| Komplexitet | Låg | Medium |
| Impact | Minimal | Transformativ |
| Passar vision | Delvis | Helt |
| Konfiguration | Enklare | Mer komplett |

**Nästa steg**: Godkänn vilket alternativ du vill gå vidare med, så implementerar jag det.

