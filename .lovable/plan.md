
# Plan: Strukturell fix för Mini-menyer

## Problem-analys

Systemet har återkommande problem med dropdown-menyer och popovers:
- Menyer flickrar och försvinner oväntat
- Klick på menyval (t.ex. "Delete" i Media Hub) fungerar inte
- Problemet är systematiskt och påverkar flera komponenter

### Rotorsaker

1. **Okontrollerad state** - Dropdown-menyer utan explicit `open`/`onOpenChange`-hantering stängs vid parent re-renders
2. **Race conditions** - Async operationer (API-anrop) triggar re-renders som kolliderar med menyns stängning
3. **Event-bubbling** - `onClick` i `DropdownMenuItem` propagerar felaktigt; bör använda `onSelect`
4. **Modal-problem** - `modal={false}` skapar instabilitet vid interaktion

---

## Lösningsstrategi

### Fas 1: Standardisera dropdown-mönster

Skapa ett konsekvent mönster för alla "action menus":

**Princip: "Close first, act later"**
```typescript
const [menuOpen, setMenuOpen] = useState(false);

const handleAction = (action: () => void) => {
  setMenuOpen(false);
  // Defer action to next tick to ensure menu closes cleanly
  setTimeout(action, 0);
};

<DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
  <DropdownMenuItem onSelect={() => handleAction(doSomething)}>
```

---

### Fas 2: Fixa PromptEnhancer (AI Assist)

**Problem**: Använder `onClick` och saknar kontrollerad state

**Åtgärd**:
- Lägg till `open`/`onOpenChange` state
- Byt från `onClick` till `onSelect`
- Stäng menyn explicit innan async operation

```typescript
const [menuOpen, setMenuOpen] = useState(false);

const handleEnhance = (action: EnhanceAction) => {
  setMenuOpen(false);
  setTimeout(() => enhancePrompt(action), 0);
};

<DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
  <DropdownMenuItem onSelect={() => handleEnhance('enhance-prompt')}>
```

---

### Fas 3: Fixa MediaHub delete-funktion

**Problem**: `modal={false}` + race condition vid delete

**Åtgärd**:
- Ta bort `modal={false}` (låt Radix hantera focus)
- Säkerställ att `handleAction` använder `onSelect` korrekt
- Verifiera att delete-dialogen öppnas korrekt

---

### Fas 4: Granska och uppdatera UI-komponenter

**dropdown-menu.tsx**:
- Säkerställ att `bg-popover` och `z-50` är korrekt konfigurerade (redan ok)

---

## Filer som ändras

| Fil | Ändring |
|-----|---------|
| `src/components/admin/PromptEnhancer.tsx` | Lägg till kontrollerad state, byt onClick → onSelect |
| `src/components/admin/MediaHub.tsx` | Ta bort modal={false}, verifiera event-hantering |

---

## Tekniska detaljer

### PromptEnhancer - före/efter

**Före:**
```tsx
<DropdownMenu>
  <DropdownMenuItem onClick={() => enhancePrompt('enhance-prompt')}>
```

**Efter:**
```tsx
const [menuOpen, setMenuOpen] = useState(false);

const safeEnhance = (action: EnhanceAction) => {
  setMenuOpen(false);
  setTimeout(() => enhancePrompt(action), 0);
};

<DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
  <DropdownMenuItem onSelect={() => safeEnhance('enhance-prompt')}>
```

### MediaHub - justering

**Ta bort:**
```tsx
<DropdownMenu open={menuOpen} onOpenChange={setMenuOpen} modal={false}>
```

**Ändra till:**
```tsx
<DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
```

---

## Förväntade resultat

- AI Assist-menyn öppnas stabilt och val fungerar utan frysning
- Media Hub delete/rename/move fungerar korrekt
- Konsekvent beteende över alla admin-dropdowns

---

## Validering

Efter implementering:
1. Testa AI Assist-knappen i AI Chat-inställningar
2. Testa delete på bilder i Media Hub
3. Verifiera att inga flickering eller oväntade stängningar sker
