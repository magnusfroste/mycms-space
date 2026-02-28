

# Workflow Visualizer for Autopilot

## Problem
Three cron jobs and multiple edge functions are running invisibly in the background. There's no way to see what's scheduled, what parameters are set, or how data flows between steps -- without reading code or querying the database directly.

## Solution
Add a visual "Workflows" card to the Autopilot dashboard that shows each automation as a mini flow diagram with editable parameters, inspired by n8n's node-based approach but kept simple with CSS-only visuals (no heavy library needed).

## What it will look like

Each workflow is rendered as a horizontal flow of connected "nodes":

```text
[Clock 06:00 UTC] --> [Gmail Inbox Scan] --> [AI Analysis] --> [agent_tasks]
[Clock 07:00 UTC] --> [Research] --> [Firecrawl + AI] --> [agent_tasks]
[Clock Mon 08:00] --> [Newsletter Draft] --> [AI] --> [newsletter_campaigns]
```

Each node shows:
- Icon + label
- Key parameters (schedule, action, filters)
- Status indicator (active/paused)
- Toggle to enable/disable

## Technical approach

### 1. New component: `WorkflowVisualizer.tsx`

A new component added to `src/components/admin/autopilot/` that:

- Reads cron job data via a new edge function endpoint (or directly queries `cron.job` table via an RPC function)
- Reads related module configs (gmail_signals, autopilot) from the existing `modules` table
- Renders each workflow as a row of connected nodes using Tailwind CSS
- Allows toggling workflows on/off (updates `cron.job.active`)
- Allows editing schedule (cron expression) and key parameters inline

### 2. Backend: Edge function `agent-autopilot` gets a new `workflows` action

Returns a combined view of:
- All cron jobs from `cron.job` table (schedule, active status, target function)
- Related module configs (autopilot defaults, gmail filter settings)
- Latest run status from `agent_tasks`

This avoids exposing `cron.job` directly to the client.

### 3. Enable/disable and schedule editing

- Toggle active/inactive: calls the edge function which runs `cron.alter_job()` 
- Edit schedule: inline cron expression input with human-readable preview (e.g., "Daily at 06:00 UTC")
- Edit parameters: links to the relevant config section (Scheduled Defaults or Gmail Settings)

### 4. Integration into AutopilotDashboard

The `WorkflowVisualizer` is placed at the top of the Autopilot dashboard, above the existing "Scheduled Defaults" card. It provides the overview, while existing cards handle the detail editing.

## UI Design

- Each workflow is a Card with a horizontal flex row of "node pills"
- Nodes are rounded boxes connected by lines (CSS borders/pseudo-elements)
- Color coding: trigger nodes (blue), action nodes (purple), output nodes (green)
- Active/paused toggle per workflow with a Switch component
- Collapsible detail view showing full parameters
- Mobile: nodes stack vertically with downward arrows

## File changes

| File | Change |
|------|--------|
| `src/components/admin/autopilot/WorkflowVisualizer.tsx` | New component |
| `src/components/admin/AutopilotDashboard.tsx` | Import and render WorkflowVisualizer at top |
| `supabase/functions/agent-autopilot/index.ts` | Add `workflows` action to list/toggle/update cron jobs |

## Scope boundaries

- No drag-and-drop workflow editor (that would be over-engineering)
- No new workflows can be created from UI (that stays code-driven)
- Focus is on **visibility and control** of existing automations
- Clean, Apple-inspired design with minimal chrome
