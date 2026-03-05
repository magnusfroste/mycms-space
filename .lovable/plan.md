

# Magnet as Admin Co-Pilot: Replace Buttons with Conversation

## The Insight from FlowPilot

FlowPilot in flowwink.com has an "Operate Mode" — a chat interface where the agent has **skills** (database-backed tool definitions) and executes them conversationally with SSE streaming, activity logging, and approval workflows. The key patterns:

1. **Skills registry** in database (`agent_skills` table) — not hardcoded tool arrays
2. **Activity feed** — every action the agent takes is logged and visible
3. **SSE streaming** — token-by-token response rendering with tool execution status
4. **Conversation persistence** — chat history saved to database
5. **Quick actions** replace buttons: "Write a blog post" instead of a Draft Blog button

In mycms, the Autopilot dashboard currently has ~8 buttons (Research, Draft Blog, Draft Newsletter, Scout Sources, Multichannel, Publish, Save Defaults) plus form inputs. All of this can become conversation with Magnet.

## What Changes

### Phase 1: Create MagnetChat admin tab (replaces Autopilot buttons)

**New file: `src/components/admin/MagnetChat.tsx`**

A full-height chat wrapper that renders `ChatInterface` in admin mode with:
- Admin quick actions that replace the Autopilot action panel buttons:
  - "Research AI agent trends" → replaces Research button
  - "Draft a blog post about..." → replaces Draft Blog button  
  - "What's in my review queue?" → replaces browsing task history
  - "Draft newsletter from recent research" → replaces Newsletter button
  - "Show me this week's stats" → replaces Stats card
- Integration selector (carry over from current Chat.tsx)
- Full-page immersive layout

**Modify: `src/components/admin/AdminSidebar.tsx`**

Add "Magnet" as a main nav item with Bot icon, positioned after Dashboard (top of list — this is the primary interaction point).

**Modify: `src/pages/Admin.tsx`**

- Register `magnet` tab in `TAB_COMPONENTS`
- Mark it as immersive layout (full height like page builder)

### Phase 2: Simplify Chat.tsx to public-only

**Modify: `src/pages/Chat.tsx`**

Strip out all admin detection logic:
- Remove `useAuth`, admin badge, admin tools, integration selector
- Always `mode="public"` 
- Clean visitor-only experience

### Phase 3: Keep Autopilot as read-only dashboard

The Autopilot dashboard stays but becomes a **read-only activity log** — you view task history and stats there, but all actions happen through Magnet chat. The action buttons ("Research", "Draft Blog", etc.) get removed over time as the admin tools in the edge function handle them conversationally.

For now, we keep Autopilot unchanged — it serves as a visual overview while Magnet does the work.

## Files to change

| File | Change |
|------|--------|
| `src/components/admin/MagnetChat.tsx` | NEW — Admin chat wrapper with admin quick actions |
| `src/components/admin/AdminSidebar.tsx` | Add "Magnet" nav item near top |
| `src/pages/Admin.tsx` | Register `magnet` tab, mark immersive |
| `src/pages/Chat.tsx` | Simplify to public-only (remove auth/admin logic) |

No edge function changes needed — admin tools already exist from previous implementation.

