// ============================================
// Module Registry
// Metadata for all available modules
// Maps modules to sidebar items & display info
// ============================================

import type { ModuleType } from '@/types/modules';

export interface ModuleRegistryEntry {
  type: ModuleType;
  name: string;
  description: string;
  icon: string; // lucide icon name
  category: 'core' | 'content' | 'integrations' | 'tools';
  // Which sidebar tab IDs this module controls visibility for
  sidebarItems: string[];
  // If true, module cannot be disabled (always on)
  locked?: boolean;
  // Default enabled state for new installs
  defaultEnabled: boolean;
}

export const moduleRegistry: ModuleRegistryEntry[] = [
  // Core — always on
  {
    type: 'header',
    name: 'Header',
    description: 'Site header with logo and navigation',
    icon: 'PanelTop',
    category: 'core',
    sidebarItems: ['navigation'],
    locked: true,
    defaultEnabled: true,
  },
  {
    type: 'footer',
    name: 'Footer',
    description: 'Site footer with social links and copyright',
    icon: 'PanelBottom',
    category: 'core',
    sidebarItems: [],
    locked: true,
    defaultEnabled: true,
  },
  {
    type: 'branding',
    name: 'Branding',
    description: 'Theme, colors and visual identity',
    icon: 'Palette',
    category: 'core',
    sidebarItems: ['branding'],
    locked: true,
    defaultEnabled: true,
  },
  {
    type: 'seo',
    name: 'SEO & AIEO',
    description: 'Search engine optimization and AI engine optimization',
    icon: 'Search',
    category: 'core',
    sidebarItems: ['seo-module'],
    locked: true,
    defaultEnabled: true,
  },
  {
    type: 'analytics',
    name: 'Analytics',
    description: 'Page views, project views and chat session tracking',
    icon: 'BarChart3',
    category: 'core',
    sidebarItems: ['dashboard'],
    locked: true,
    defaultEnabled: true,
  },

  // Content
  {
    type: 'projects',
    name: 'Projects',
    description: 'Project showcase with categories, layouts and detail pages',
    icon: 'FolderOpen',
    category: 'content',
    sidebarItems: ['projects-module'],
    defaultEnabled: true,
  },
  {
    type: 'blog',
    name: 'Blog',
    description: 'Blog posts with categories, SEO and scheduling',
    icon: 'PenSquare',
    category: 'content',
    sidebarItems: ['blog', 'blog-module'],
    defaultEnabled: true,
  },
  {
    type: 'newsletter',
    name: 'Newsletter',
    description: 'Email newsletter with subscriber management',
    icon: 'Mail',
    category: 'content',
    sidebarItems: ['newsletter'],
    defaultEnabled: true,
  },
  {
    type: 'resume',
    name: 'Resume',
    description: 'Professional resume with experience, education and skills',
    icon: 'BookUser',
    category: 'content',
    sidebarItems: ['resume'],
    defaultEnabled: true,
  },

  // Integrations
  {
    type: 'ai',
    name: 'AI Chat',
    description: 'AI-powered chat with multiple provider support',
    icon: 'Bot',
    category: 'integrations',
    sidebarItems: ['chat', 'chat-settings', 'chat-history'],
    defaultEnabled: true,
  },
  {
    type: 'github',
    name: 'GitHub',
    description: 'Display and manage GitHub repositories',
    icon: 'Github',
    category: 'integrations',
    sidebarItems: ['github-repos'],
    defaultEnabled: true,
  },
  {
    type: 'webhooks',
    name: 'Webhooks',
    description: 'Outgoing webhook notifications for system events',
    icon: 'Webhook',
    category: 'integrations',
    sidebarItems: ['webhooks'],
    defaultEnabled: false,
  },

  // Tools
  {
    type: 'chrome_extension',
    name: 'Chrome Extension',
    description: 'Browser extension bridge for content capture',
    icon: 'Globe',
    category: 'tools',
    sidebarItems: ['chrome-extension'],
    defaultEnabled: false,
  },
];

// Quick lookup by module type
export const moduleRegistryMap = new Map(
  moduleRegistry.map((m) => [m.type, m])
);

// Get all sidebar item IDs that should be hidden when their module is disabled
export const getHiddenSidebarItems = (
  modules: Array<{ module_type: string; enabled: boolean | null }>
): Set<string> => {
  const hidden = new Set<string>();

  for (const entry of moduleRegistry) {
    if (entry.locked) continue; // core modules are always visible

    const dbModule = modules.find((m) => m.module_type === entry.type);
    // If module doesn't exist in DB yet, use defaultEnabled
    const isEnabled = dbModule ? (dbModule.enabled ?? true) : entry.defaultEnabled;

    if (!isEnabled) {
      entry.sidebarItems.forEach((id) => hidden.add(id));
    }
  }

  return hidden;
};

// Category labels
export const moduleCategoryLabels: Record<string, string> = {
  core: 'Core',
  content: 'Content',
  integrations: 'Integrations',
  tools: 'Tools',
};
