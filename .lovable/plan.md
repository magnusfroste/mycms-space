
# Magnet Dual-Mode: Public Agent vs Private Agent

## Status: ✅ Implemented

The `/chat` route now detects authentication state and switches Magnet between two modes:

### Public Mode (visitors)
- Tools: CV Agent, Portfolio, Project Deep Dive, Availability
- Persona: "Magnet, Magnus's digital twin"

### Admin Mode (logged-in)
- Tools: Research, Draft Blog, Draft All Channels, Review Queue, Approve Task, Site Stats
- Persona: "Magnet CMS co-pilot"
- Admin badge shown in header

## Files Changed

| File | Change |
|------|--------|
| `src/components/chat/types.ts` | Added `ChatMode` type and `mode` prop |
| `src/components/chat/ChatInterface.tsx` | Accepts and passes `mode` prop |
| `src/components/chat/useChatMessages.ts` | Sends `mode` to edge function |
| `src/pages/Chat.tsx` | Auth detection, admin placeholders, admin tools |
| `src/types/modules.ts` | Added `defaultAdminMagnetTools` |
| `supabase/functions/_shared/ai-tools.ts` | Admin tool definitions + mode-aware registry |
| `supabase/functions/_shared/ai-context.ts` | `buildAdminPrompt()` function |
| `supabase/functions/_shared/ai-agent.ts` | Mode-aware agent runner |
| `supabase/functions/ai-chat/index.ts` | Passes mode to agent |

## Next Steps

- [ ] Add admin quick actions (review queue, research, stats)
- [ ] Implement actual tool execution (call autopilot handlers from admin tools)
- [ ] Add daily_pipeline cron for autonomous content generation
- [ ] Build review queue UI in Autopilot dashboard
