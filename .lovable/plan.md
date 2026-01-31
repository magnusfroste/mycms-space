
# Plan: Versionshantering för Kritiska Inställningar

## Bakgrund
Just nu finns ingen automatisk backup eller versionshistorik i databasen. När data uppdateras försvinner det gamla värdet permanent. Detta är riskabelt för singleton-tabeller som `about_me_settings` och `page_blocks`.

## Lösning
Implementera en enkel audit/historik-funktion som automatiskt sparar en kopia av data innan det ändras.

---

## Del 1: Skapa historik-tabell

Skapa en generisk `settings_history` tabell som lagrar snapshots av alla settings-ändringar:

```text
┌─────────────────────────────────────────────────────┐
│                 settings_history                     │
├─────────────────────────────────────────────────────┤
│ id            UUID (PK)                             │
│ table_name    TEXT (vilken tabell)                  │
│ record_id     UUID (ursprunglig post)               │
│ old_data      JSONB (snapshot av data)              │
│ changed_at    TIMESTAMP                             │
│ changed_by    TEXT (valfritt)                       │
└─────────────────────────────────────────────────────┘
```

## Del 2: Skapa automatiska triggers

Triggers på kritiska tabeller som sparar en kopia INNAN update/delete:

- `about_me_settings`
- `hero_settings`  
- `portfolio_settings`
- `chat_settings`
- `page_blocks`

## Del 3: Admin-gränssnitt för historik

Skapa en "Historik"-vy i admin där man kan:
1. Se lista över alla ändringar (tabell, tid, vem)
2. Förhandsgranska gammal data
3. Återställa till en tidigare version med ett klick

```text
┌─────────────────────────────────────────────────────┐
│  Admin → Historik                                   │
├─────────────────────────────────────────────────────┤
│  Tabell          │ Ändrad          │ Åtgärd        │
│  ─────────────── │ ─────────────── │ ──────────    │
│  about_me        │ 29 jan 14:32    │ [Visa] [Åters]│
│  hero_settings   │ 29 jan 10:15    │ [Visa] [Åters]│
│  page_blocks     │ 28 jan 18:45    │ [Visa] [Åters]│
└─────────────────────────────────────────────────────┘
```

---

## Teknisk implementation

### Steg 1: Migration - Skapa historik-tabell
Skapar tabellen `settings_history` med RLS-policies för admin-åtkomst.

### Steg 2: Migration - Skapa trigger-funktion
En generisk funktion `log_settings_change()` som sparar `OLD` data till historik-tabellen.

### Steg 3: Migration - Aktivera triggers
Kopplar triggern till alla kritiska tabeller.

### Steg 4: Data Layer
- `src/data/settingsHistory.ts` - API-anrop för att hämta och återställa historik

### Steg 5: Model Layer  
- `src/models/settingsHistory.ts` - React Query hooks

### Steg 6: Admin UI
- `src/components/admin/SettingsHistory.tsx` - Historik-lista med visa/återställ
- Uppdatera `AdminSidebar.tsx` och `Admin.tsx` med ny navigation

---

## Fördelar
- **Automatiskt** - Inga manuella steg behövs
- **Enkelt** - En tabell för all historik
- **Icke-invasivt** - Påverkar inte befintlig kod
- **Återställbart** - Ett klick för att gå tillbaka

## Begränsningar
- Lagrar endast de senaste ~50 versionerna per tabell (kan konfigureras)
- Sparar inte Storage-filer (bara databas-data)
