

# Magnet som Admin-tab: En agent, två ytor

## Koncept

Magnet är EN agent (en modul med verktyg). Den serverar besökare via det publika `/chat`-blocket och admin via en ny tab i admin-panelen. Ingen ny agent skapas — samma `ChatInterface`, samma `ai-chat` edge function, bara olika verktyg beroende på kontext.

```text
        ONE MAGNET AGENT
        (ai-chat edge fn)
              |
     +--------+--------+
     |                  |
  PUBLIC SURFACE     ADMIN SURFACE
  /chat route        /admin?tab=magnet
  CvAgent block      Admin sidebar tab
     |                  |
  Tools:             Tools:
  - cv_match         - run_research
  - portfolio        - draft_blog
  - deep_dive        - review_queue
  - availability     - approve_task
                     - site_stats
```

## Changes

### 1. Add "Magnet" tab to Admin Sidebar

In `src/components/admin/AdminSidebar.tsx`, add a new nav item:
```
{ id: 'magnet', label: 'Magnet', icon: Bot }
```

Place it near the top of `mainNavItems` (after Dashboard or after Autopilot) since it's the primary interaction point.

### 2. Create Admin Magnet wrapper component

New file: `src/components/admin/MagnetChat.tsx`

A thin wrapper that renders `ChatInterface` with admin-mode props:
- `mode="admin"`
- `fullPage={true}` 
- Admin placeholders ("Hey Magnus, what should we work on?")
- Admin-specific quick actions
- Loads `useAIModule()` config and `useAIChatContext()` for site context
- Uses the same integration selector logic currently in `Chat.tsx`

This keeps all the admin chat logic that's currently in `Chat.tsx` but embedded in the admin layout.

### 3. Register in Admin route map

In `src/pages/Admin.tsx`:
- Lazy-load `MagnetChat`
- Add `magnet: MagnetChat` to `TAB_COMPONENTS`
- Mark it as immersive layout (full height, like the page builder)

### 4. Simplify `/chat` page back to public-only

`src/pages/Chat.tsx` becomes simpler:
- Remove all admin detection logic (`useAuth`, admin badge, admin tools)
- Always runs in `mode="public"`
- No integration selector dropdown (uses configured default)
- Clean, visitor-focused experience

### 5. No edge function changes needed

The `ai-chat` edge function already supports `mode: 'public' | 'admin'`. The admin tools and prompts added in the previous implementation remain as-is. The only change is WHERE the admin surface lives (admin panel tab instead of `/chat` with auth detection).

## What this achieves

- **One agent**: Magnet is a single module, not two separate agents
- **Two surfaces**: Public visitors use `/chat`, admin uses the sidebar tab
- **No navigation away**: Admin stays in the admin panel to talk to Magnet
- **Clean separation**: `/chat` is purely public, no auth logic cluttering it
- **Reuse**: Same `ChatInterface` component, same edge function, same tools registry

## Files to change

| File | Change |
|------|--------|
| `src/components/admin/AdminSidebar.tsx` | Add "Magnet" nav item with Bot icon |
| `src/components/admin/MagnetChat.tsx` | NEW - Admin chat wrapper (extracts admin logic from Chat.tsx) |
| `src/pages/Admin.tsx` | Register `magnet` tab in route map |
| `src/pages/Chat.tsx` | Simplify to public-only (remove useAuth, admin detection) |

No edge function changes. No new tables. No new agents.

