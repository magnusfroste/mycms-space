// ============================================
// Module Registry
// What each module adds, where it is managed in the admin, how far an
// operator can reach it through MCP, and which admin entries it hides when off.
// ============================================

import type { ModuleType } from '@/types/modules';

export type ModuleGroup = 'core' | 'content' | 'agents';

/** How much of the module an operator can manage through MCP. */
export type McpCoverage = 'full' | 'part' | 'no' | 'na';

export interface ModuleRegistryEntry {
  type: ModuleType;
  name: string;
  /** One sentence: what the module adds to the site. */
  description: string;
  group: ModuleGroup;
  /**
   * Admin entries hidden when the module is off: sidebar view ids
   * (e.g. 'blog') or inner tabs ('site-settings:webhooks').
   */
  sidebarItems: string[];
  /** Core modules cannot be switched off. */
  locked?: boolean;
  defaultEnabled: boolean;
  /** Where the module is managed in the admin. */
  admin: { label: string; view: string; section?: string };
  mcp: McpCoverage;
  dependencies?: ModuleType[];
}

export const moduleRegistry: ModuleRegistryEntry[] = [
  // Core — the site does not work without these
  {
    type: 'resume',
    name: 'Knowledge base',
    description: 'Profile and markdown documents that ground the chat and the CV tools.',
    group: 'core',
    sidebarItems: [],
    locked: true,
    defaultEnabled: true,
    admin: { label: 'Knowledge base', view: 'knowledge' },
    mcp: 'full',
    dependencies: ['ai'],
  },
  {
    type: 'header',
    name: 'Header',
    description: 'Logo, navigation links and the mobile menu.',
    group: 'core',
    sidebarItems: [],
    locked: true,
    defaultEnabled: true,
    admin: { label: 'Site settings', view: 'site-settings', section: 'navigation' },
    mcp: 'full',
  },
  {
    type: 'footer',
    name: 'Footer',
    description: 'Social links and copyright at the bottom of every page.',
    group: 'core',
    sidebarItems: [],
    locked: true,
    defaultEnabled: true,
    admin: { label: 'Site settings', view: 'site-settings', section: 'appearance' },
    mcp: 'full',
  },
  {
    type: 'branding',
    name: 'Appearance',
    description: 'Colours, fonts and dark mode of the public site.',
    group: 'core',
    sidebarItems: [],
    locked: true,
    defaultEnabled: true,
    admin: { label: 'Site settings', view: 'site-settings', section: 'appearance' },
    mcp: 'full',
  },
  {
    type: 'seo',
    name: 'SEO & AIEO',
    description: 'Titles, sitemap, llms.txt and structured data.',
    group: 'core',
    sidebarItems: [],
    locked: true,
    defaultEnabled: true,
    admin: { label: 'Site settings', view: 'site-settings', section: 'seo' },
    mcp: 'full',
  },
  {
    type: 'analytics',
    name: 'Analytics',
    description: 'Page views, chat sessions and the funnel on Overview.',
    group: 'core',
    sidebarItems: [],
    locked: true,
    defaultEnabled: true,
    admin: { label: 'Analytics', view: 'analytics' },
    mcp: 'part',
  },

  // Content — what visitors read
  {
    type: 'blog',
    name: 'Blog',
    description: 'Posts with categories, SEO and scheduling.',
    group: 'content',
    sidebarItems: ['blog'],
    defaultEnabled: true,
    admin: { label: 'Blog', view: 'blog' },
    mcp: 'full',
  },
  {
    type: 'projects',
    name: 'Projects',
    description: 'Case studies built from your GitHub repositories.',
    group: 'content',
    sidebarItems: ['projects'],
    defaultEnabled: true,
    admin: { label: 'Projects', view: 'projects' },
    mcp: 'full',
  },
  {
    type: 'newsletter',
    name: 'Newsletter',
    description: 'Subscribers and campaigns, sent with Resend.',
    group: 'content',
    sidebarItems: ['newsletter'],
    defaultEnabled: true,
    admin: { label: 'Newsletter', view: 'newsletter' },
    mcp: 'full',
  },

  // Agents & connections — how the site talks to people and other systems
  {
    type: 'ai',
    name: 'Magnet chat',
    description: 'The AI twin on the site, with tools for CV match and project deep dives.',
    group: 'agents',
    sidebarItems: ['magnet', 'conversations'],
    defaultEnabled: true,
    admin: { label: 'Magnet', view: 'magnet' },
    mcp: 'na',
  },
  {
    type: 'github',
    name: 'GitHub',
    description: 'Syncs repositories into Projects every night.',
    group: 'agents',
    sidebarItems: [],
    defaultEnabled: true,
    admin: { label: 'Integrations', view: 'integrations' },
    mcp: 'part',
  },
  {
    type: 'webhooks',
    name: 'Webhooks',
    description: 'Sends events such as new contact messages to other services.',
    group: 'agents',
    sidebarItems: ['site-settings:webhooks'],
    defaultEnabled: false,
    admin: { label: 'Site settings', view: 'site-settings', section: 'webhooks' },
    mcp: 'part',
  },
  {
    type: 'chrome_extension',
    name: 'Chrome extension',
    description: 'Captures pages from your browser into the agent.',
    group: 'agents',
    sidebarItems: ['site-settings:chrome-extension'],
    defaultEnabled: false,
    admin: { label: 'Site settings', view: 'site-settings', section: 'chrome-extension' },
    mcp: 'no',
  },
];

export const moduleGroupLabels: Record<ModuleGroup, { title: string; hint: string }> = {
  core: { title: 'Core', hint: 'The site does not work without these.' },
  content: { title: 'Content', hint: 'What visitors read.' },
  agents: { title: 'Agents & connections', hint: 'How the site talks to people and other systems.' },
};

/** Whether a module is on, falling back to its default when it has no row yet. */
export const isModuleEnabled = (
  entry: ModuleRegistryEntry,
  modules: Array<{ module_type: string; enabled: boolean | null }>,
): boolean => {
  if (entry.locked) return true;
  const dbModule = modules.find((m) => m.module_type === entry.type);
  return dbModule ? (dbModule.enabled ?? true) : entry.defaultEnabled;
};

// Admin entries that should be hidden because their module is off
export const getHiddenSidebarItems = (
  modules: Array<{ module_type: string; enabled: boolean | null }>,
): Set<string> => {
  const hidden = new Set<string>();
  for (const entry of moduleRegistry) {
    if (!isModuleEnabled(entry, modules)) entry.sidebarItems.forEach((id) => hidden.add(id));
  }
  return hidden;
};
