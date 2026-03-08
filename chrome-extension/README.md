# MyCMS Chrome Extension v2.0

A command palette for capturing web content to your CMS autopilot.

## Features

### ⚡ Command Palette
- **Floating ⚡ button** on every page (bottom-right)
- **Keyboard shortcut**: `⌘⇧S` (Mac) / `Ctrl+Shift+S` (Windows)
- **Auto-detects** source: LinkedIn, X/Twitter, GitHub, Reddit, YouTube, web
- **Three actions**: Send Signal, Save as Draft, Bookmark
- **Selection-aware** — captures selected text, or falls back to main content
- **No DOM dependency** — works everywhere, never breaks

### 🔌 Remote Scraping
Admin panel can send messages to the extension via `externally_connectable`:
- `ping` — check extension is installed
- `scrape_active_tab` — grab content from current tab
- `navigate_and_scrape` — open URL in background tab, scrape, close

## Setup

1. `chrome://extensions/` → Developer mode → Load unpacked → select `chrome-extension/`
2. Click extension icon → Settings → paste **Signal Ingest Token** from Admin → Settings → API Tokens
