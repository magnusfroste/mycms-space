

# Magnet Gets Superpowers: CV Agent via Tool Calling + Artifacts

## The Idea

Instead of building a separate CV Agent page, we **upgrade Magnet** with a new tool: `generate_tailored_cv`. When a recruiter pastes a job description in chat, Magnet analyzes it against Magnus's master knowledge (from the `/resume` page) and returns structured results rendered as **rich artifact cards** directly in the chat -- like Claude's artifacts.

The landing page gets a premium CTA block that funnels the recruiter into `/chat` with the JD pre-filled.

## Architecture

```text
Landing Page Block (cv-agent)
  "Is Magnus the Right Fit?"
  [textarea: paste JD]
  [Analyze Match ->]
        |
        v
  navigate('/chat', { state: { messages: [{ text: JD }] } })
        |
        v
  Magnet (ai-chat edge function)
  - Detects JD via tool calling
  - Loads /resume page blocks from DB
  - Calls AI with generate_tailored_cv tool
  - Returns structured JSON artifact
        |
        v
  ChatMessage renders artifact cards:
  - Match radar chart (Recharts)
  - Tailored CV (markdown)
  - Cover letter (markdown)
```

## What Gets Built

### 1. Artifact System for Chat Messages

**Extend `Message` type** (`src/components/chat/types.ts`)
- Add optional `artifacts` array to `Message`:
  ```
  artifacts?: Array<{
    type: 'cv-match' | 'document';
    title: string;
    data: Record<string, unknown>;
  }>
  ```

**New component: `src/components/chat/ChatArtifact.tsx`**
- Renders rich cards below the message text
- For `cv-match` type: 3-tab card with Match Analysis (Recharts radar), Tailored CV (markdown), Cover Letter (markdown)
- Copy-to-clipboard on each tab
- Clean, Apple-design card with subtle border and shadow

**Update `ChatMessage.tsx`**
- After the message bubble, render any `artifacts` using `ChatArtifact`

### 2. Upgrade `ai-chat` Edge Function

**Add tool calling** to the Lovable AI handler in `supabase/functions/ai-chat/index.ts`:

- Define `generate_tailored_cv` tool with structured parameters:
  - `match_analysis`: array of `{ skill, required_level, magnus_level, category }`
  - `overall_score`: number (0-100)
  - `tailored_cv`: string (markdown)
  - `cover_letter`: string (markdown)
  - `summary`: string (one-line match summary)

- When the AI calls this tool, the edge function returns the structured data as an `artifact` alongside the message text

- **Load resume context server-side**: Query `page_blocks` where `page_slug = 'resume'` to get Magnus's master knowledge (same pattern as `useAIChatContext` but on the backend)

- Add a `cv_agent` instruction to the system prompt when resume data is available:
  ```
  You have a tool called generate_tailored_cv. When a user pastes a job description,
  use this tool to analyze the match and generate a tailored CV and cover letter.
  ```

### 3. Update `useChatMessages` Hook

**Parse artifact responses** (`src/components/chat/useChatMessages.ts`):
- When the edge function returns `{ output, artifacts }`, attach artifacts to the bot message
- The artifact data flows through the existing message pipeline

### 4. Landing Page Block: `cv-agent`

**New block: `src/components/blocks/CvAgentBlock.tsx`**
- Gradient CTA card (reuses CTA Banner aesthetic)
- "AI-Powered" badge
- Title: "Is Magnus the Right Fit?"
- Subtitle: "Paste a job description and let Magnet analyze the match"
- Textarea for JD input
- "Analyze Match" button
- Three feature pills: Skill Match, Tailored CV, Cover Letter
- On submit: navigates to `/chat` with JD as initial message

**Register the block:**
- `CvAgentBlockConfig` in `src/types/blockConfigs.ts`
- Default config in `blockDefaults`
- Label in `blockTypeLabels.ts`
- Case in `BlockRenderer.tsx`
- Export in `blocks/index.ts`

### 5. Admin Editor

**New: `src/components/admin/block-editor/CvAgentBlockEditor.tsx`**
- Simple form: title, subtitle, badge text, button text, placeholder text
- Follows existing editor pattern

## File Summary

| Action | File | What |
|--------|------|------|
| Modify | `src/components/chat/types.ts` | Add `artifacts` to `Message` type |
| Create | `src/components/chat/ChatArtifact.tsx` | Rich artifact card renderer (tabs, radar, markdown, copy) |
| Modify | `src/components/chat/ChatMessage.tsx` | Render artifacts below message bubble |
| Modify | `src/components/chat/useChatMessages.ts` | Parse artifact data from edge function response |
| Modify | `supabase/functions/ai-chat/index.ts` | Add tool calling + resume context loading + artifact response |
| Create | `src/components/blocks/CvAgentBlock.tsx` | Landing page CTA block with JD input |
| Modify | `src/types/blockConfigs.ts` | Add `CvAgentBlockConfig` |
| Modify | `src/lib/constants/blockDefaults.ts` | Add `cv-agent` defaults |
| Modify | `src/lib/constants/blockTypeLabels.ts` | Add `'cv-agent': 'CV Agent'` |
| Modify | `src/components/blocks/BlockRenderer.tsx` | Add `cv-agent` case |
| Modify | `src/components/blocks/index.ts` | Export `CvAgentBlock` |
| Create | `src/components/admin/block-editor/CvAgentBlockEditor.tsx` | Block config editor |

## Technical Decisions

- **No new pages** -- everything happens in `/chat` via Magnet
- **No new database tables** -- resume data read from existing `page_blocks` (server-side in edge function)
- **Tool calling** for structured output (not JSON parsing)
- **Recharts** (already installed) for match radar visualization
- **MarkdownContent** (already exists) for CV and cover letter rendering
- **Lovable AI** with `google/gemini-2.5-flash` (fast, good at tool calling)
- **Artifact pattern is extensible** -- future tools can return different artifact types (charts, documents, images) rendered as cards in chat

## Implementation Order

1. Extend `Message` type with artifacts + create `ChatArtifact` component
2. Update `ChatMessage` to render artifacts
3. Upgrade `ai-chat` edge function with tool calling + resume context
4. Update `useChatMessages` to parse artifact responses
5. Build `CvAgentBlock` for landing page
6. Register block type (configs, defaults, labels, renderer)
7. Create admin block editor

## Future Vision

This artifact system is the foundation for Magnet's evolution:
- **More tools**: portfolio generator, project deep-dive, availability checker
- **A2A protocol**: External agents call the same `ai-chat` endpoint, get structured artifact responses
- **Agent Card** (`/.well-known/agent.json`): Advertises Magnet's capabilities including `generate_tailored_cv`
- The chat becomes the universal interface; artifacts are the universal output format

