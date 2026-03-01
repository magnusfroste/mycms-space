

# Magnet Dual-Mode: Public Agent vs Private Agent

## The Insight

Right now there's one Magnet — the public-facing digital twin that helps visitors explore Magnus's profile. But the admin (Magnus) also needs an agent: one that manages content, runs autopilot actions, reviews drafts, and operates the CMS conversationally. Instead of building a separate admin chat, we reuse `/chat` and switch Magnet's personality and tools based on auth state.

This mirrors OpenClaw's pattern: the agent IS the interface. No dashboard buttons needed — you just talk to Magnet and it does things for you.

## How It Works

```text
/chat (same route, same component)
         │
    ┌────┴────┐
    │ Auth?   │
    └────┬────┘
   No    │    Yes
   │     │     │
   v           v
┌──────────┐  ┌──────────────────┐
│ PUBLIC   │  │ PRIVATE (Admin)  │
│ MAGNET   │  │ MAGNET           │
│          │  │                  │
│ Tools:   │  │ Tools:           │
│ - CV     │  │ - Research topic │
│ - Port-  │  │ - Draft blog     │
│   folio  │  │ - Draft all ch.  │
│ - Deep   │  │ - Review queue   │
│   dive   │  │ - Publish post   │
│ - Avail. │  │ - Scout sources  │
│          │  │ - Newsletter     │
│ Persona: │  │ - Site stats     │
│ "Magnet, │  │                  │
│  Magnus's│  │ Persona:         │
│  digital │  │ "Magnet, your    │
│  twin"   │  │  CMS co-pilot"   │
└──────────┘  └──────────────────┘
```

## Implementation

### 1. Detect Auth in Chat Page

Add `useAuth()` to `src/pages/Chat.tsx`. If `user` exists, Magnet switches to admin mode:
- Different system prompt (CMS co-pilot vs public twin)
- Different tool set (admin tools vs visitor tools)
- Different quick actions ("What's in my review queue?" vs "Tell me about Magnus")
- Different placeholder text

### 2. Add Admin Tools to Edge Function

New tools in `supabase/functions/_shared/ai-tools.ts`:

- **`run_research`** — Triggers research on a topic (calls autopilot handler)
- **`draft_blog_post_from_research`** — Creates a blog draft from recent research
- **`draft_all_channels`** — Multichannel content from a topic
- **`list_review_queue`** — Shows pending `needs_review` tasks
- **`approve_task`** — Publishes a blog post or sends a newsletter
- **`get_site_stats`** — Recent analytics summary

These tools call the existing autopilot handlers internally, so no logic duplication.

### 3. Auth-Aware Edge Function

Update `supabase/functions/ai-chat/index.ts` to accept a `mode: 'public' | 'admin'` flag. When `admin`:
- Load admin tool definitions instead of visitor tools
- Use admin system prompt
- Verify the request has a valid auth token (check JWT)

### 4. Frontend Changes

**`src/pages/Chat.tsx`:**
- Import and use `useAuth()`
- Pass `mode: user ? 'admin' : 'public'` to ChatInterface
- Set appropriate quick actions per mode

**`src/components/chat/ChatInterface.tsx`:**
- Accept `mode` prop, forward to `useChatMessages`

**`src/components/chat/useChatMessages.ts`:**
- Include `mode` in the body sent to `ai-chat` edge function

**`src/types/modules.ts`:**
- Add admin tool configs (similar to `defaultMagnetTools`)

### 5. Admin Quick Actions

When admin is logged in, show contextual quick actions like:
- "What's pending in my review queue?"
- "Research AI agent trends today"
- "Draft a blog post about [recent topic]"
- "Show me this week's stats"

### 6. Tool Execution Flow (Admin)

When admin says "Research AI agent security":
1. Magnet calls `run_research` tool with topic
2. Edge function calls the existing `handleResearch` from autopilot
3. Returns structured result as an artifact
4. Magnet says "Done! I found 5 key findings. Want me to draft a blog post from this?"

This is the conversational OpenClaw pattern — no buttons, just dialogue.

## What Stays the Same

- All existing public Magnet functionality (CV agent, portfolio, etc.)
- The Autopilot dashboard (remains as a visual overview)
- Edge function architecture (reuses existing handlers)
- Chat component structure (minimal prop additions)

## Technical Summary

| File | Change |
|------|--------|
| `src/pages/Chat.tsx` | Add `useAuth()`, pass mode + admin quick actions |
| `src/components/chat/ChatInterface.tsx` | Accept `mode` prop |
| `src/components/chat/useChatMessages.ts` | Send `mode` to edge function |
| `src/components/chat/types.ts` | Add `mode` to props |
| `supabase/functions/_shared/ai-tools.ts` | Add admin tool definitions |
| `supabase/functions/ai-chat/index.ts` | Handle `mode`, load correct tools + prompt |
| `supabase/functions/_shared/ai-agent.ts` | Pass mode to tool selection |

No new tables, no new edge functions, no new routes. Just a mode switch that unlocks a different Magnet.

