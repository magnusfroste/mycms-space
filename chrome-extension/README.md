# MyCMS Signal Capture — Chrome Extension

Capture web pages, LinkedIn posts, and X/Twitter threads and send them as signals to your CMS autopilot.

## Installation

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer Mode** (toggle in the top-right corner).
3. Click **Load unpacked** and select this `chrome-extension/` folder.
4. The ⚡ icon appears in your toolbar — pin it for quick access.

## Setup

1. In your CMS admin, go to **Profile → API Tokens**.
2. Click **Generate Token** and copy it.
3. Click the extension icon, then **⚙ Settings**.
4. Paste the token into the **API Token** field and click **Save Settings**.

The endpoint is pre-configured. Only change it if you self-host.

## Usage

1. Navigate to any web page.
2. Optionally **select text** you want to capture (otherwise the full page content is extracted).
3. Click the extension icon.
4. Choose the **source type** (Web, LinkedIn, or X/Twitter) — auto-detected from the URL.
5. Add an optional **note** explaining why it's interesting.
6. Click **Send Signal**.

The signal appears in your **Autopilot → Task History** under the **Signals** tab.

## How it works

- Extracts selected text, or falls back to `<article>` / `<body>` content (up to 8 000 chars).
- Sends a `POST` request to the `signal-ingest` backend function with bearer token auth.
- The signal is stored as a pending task for the autopilot agent to process.

## Permissions

| Permission   | Why                                      |
|-------------|------------------------------------------|
| `activeTab`  | Access the current tab's URL and title    |
| `scripting`  | Extract page content from the active tab  |
| `storage`    | Persist your endpoint and token locally   |

## Troubleshooting

- **"Set your API token"** → Open Settings and paste your token.
- **401 / Invalid token** → Regenerate the token in Profile and update Settings.
- **Content empty** → Some pages (e.g. `chrome://`, PDFs) block content extraction. The URL and title are still captured.
