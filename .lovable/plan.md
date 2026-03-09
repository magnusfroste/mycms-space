

## Conversational Hero — Typewriter Agent Greeting

### Vision
When a visitor lands on the page, the agent "speaks" to them via a typewriter animation — character by character, as if typing in real-time. Optional subtle keystroke sounds reinforce the illusion. The effect creates urgency to respond, turning the hero from a static display into a living conversation.

### What changes

**1. New component: `src/components/animations/TypewriterText.tsx`**
- Renders text character-by-character at ~40ms/char with a blinking cursor
- Optional keystroke sound (Web Audio API — tiny synthesized tick, no audio files needed)
- Configurable: `text`, `speed`, `delay`, `enableSound`, `onComplete` callback
- Sound muted by default, toggle via a small speaker icon

**2. Update `ChatHeroBlock.tsx`**
- Replace static `agentTagline` paragraph with `TypewriterText`
- Sequence: badge fades in → agent name fades in → tagline types out character-by-character → input + quick actions fade in after typing completes
- Add a subtle "agent avatar" pulse indicator (small animated dot or circle) above the typewriter text to reinforce "someone is typing"
- New config fields control the greeting messages

**3. Extend `ChatHeroBlockConfig` in `blockConfigs.ts`**
- Add: `greeting_messages?: string[]` — array of lines the agent "types" (cycles or plays sequentially)
- Add: `typewriter_speed?: number` — ms per character (default 40)
- Add: `enable_sound?: boolean` — keystroke sound toggle (default false)

**4. Update `ChatHeroEditor.tsx`**
- Add fields for `greeting_messages` (editable list), `typewriter_speed` (slider), `enable_sound` (switch)

### UX flow

```text
[0.0s] Badge fades in: "Welcome"
[0.3s] Agent name fades in: "Magnet"
[0.6s] Typing indicator appears (pulsing dots)
[0.8s] Typewriter starts: "Hi! I'm Magnus' AI twin..."
         ↳ optional soft keystroke sounds
[~3s]  Typewriter done → cursor blinks
[3.2s] Chat input fades in (auto-focused)
[3.4s] Quick actions fade in
```

The visitor sees text being typed directly to them — creating the feeling of a live conversation before they've even typed anything.

### Technical notes
- Keystroke sound via `AudioContext.createOscillator()` — a 2ms sine wave click, no external files
- Sound respects a mute toggle rendered as a small icon in the corner
- `TypewriterText` uses `requestAnimationFrame` for smooth rendering
- No new dependencies required

