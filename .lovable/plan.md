

# API Token Section in Profile

## Overview
Add an "API Tokens" card to the Profile page where you can generate and manage a personal API token. This token will be used by external tools (like the Chrome extension for signal capture) to authenticate against backend endpoints.

## Approach
Store the token in the `modules` table (type `api_tokens`) so it's readable from the admin UI and verifiable from backend functions. This avoids the limitation that backend secrets can't be read from the frontend.

## Changes

### 1. ProfileSettings.tsx
Add a new Card section "API Tokens" between Account and Media Picker:
- Shows the current token (masked by default, with a show/hide toggle)
- "Generate Token" button creates a random 32-char hex token
- "Regenerate" button replaces the existing token (with confirmation)
- "Copy" button copies the token to clipboard
- Helper text explaining this token is used for external integrations (Chrome extension, webhooks)

### 2. Token Storage
Use the existing `modules` table with `module_type = 'api_tokens'` and `module_config = { signal_ingest_token: "..." }`. Same pattern as the author profile -- no database migration needed.

### 3. Token Generation
Generate client-side using `crypto.randomUUID()` combined with a timestamp hash, or `crypto.getRandomValues()` for a secure 32-byte hex string. Simple, no backend call needed for generation.

## UI Design
```text
+----------------------------------+
| Key  API Tokens                  |
|                                  |
| Signal Ingest Token              |
| [******************************] |
| [Eye] [Copy] [Regenerate]       |
|                                  |
| Used by the Chrome extension     |
| and external tools to send       |
| signals to your CMS.             |
+----------------------------------+
```

## Technical Details
- Token stored in `modules` table, same CRUD pattern as author profile
- No new database tables or migrations required
- Token masked with dots/stars, revealed on click
- Copy-to-clipboard with toast confirmation
- Regenerate requires a confirmation dialog to prevent accidental reset
- The future `signal-ingest` edge function will query this token from the `modules` table to validate requests

