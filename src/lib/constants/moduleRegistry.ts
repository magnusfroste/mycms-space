// ============================================
// Module Registry
// Metadata for all available modules
// Maps modules to sidebar items & display info
// ============================================

import type { ModuleType } from '@/types/modules';

export type ModuleStatus = 'installed' | 'coming_soon';

export interface ModuleRegistryEntry {
  type: ModuleType | string; // string for coming_soon modules not yet in ModuleType
  name: string;
  description: string;
  icon: string;
  category: 'core' | 'content' | 'integrations' | 'tools';
  sidebarItems: string[];
  locked?: boolean;
  defaultEnabled: boolean;
  status: ModuleStatus;
  version: string;
  author?: string;
  tags?: string[];
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
    status: 'installed',
    version: '1.0.0',
    author: 'ClawCMS',
    tags: ['layout', 'navigation'],
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
    status: 'installed',
    version: '1.0.0',
    author: 'ClawCMS',
    tags: ['layout', 'social'],
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
    status: 'installed',
    version: '1.0.0',
    author: 'ClawCMS',
    tags: ['theme', 'design'],
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
    status: 'installed',
    version: '1.1.0',
    author: 'ClawCMS',
    tags: ['seo', 'ai', 'search'],
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
    status: 'installed',
    version: '1.0.0',
    author: 'ClawCMS',
    tags: ['analytics', 'tracking'],
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
    status: 'installed',
    version: '1.2.0',
    author: 'ClawCMS',
    tags: ['portfolio', 'showcase'],
  },
  {
    type: 'blog',
    name: 'Blog',
    description: 'Blog posts with categories, SEO and scheduling',
    icon: 'PenSquare',
    category: 'content',
    sidebarItems: ['blog', 'blog-module'],
    defaultEnabled: true,
    status: 'installed',
    version: '1.3.0',
    author: 'ClawCMS',
    tags: ['content', 'publishing'],
  },
  {
    type: 'newsletter',
    name: 'Newsletter',
    description: 'Email newsletter with subscriber management',
    icon: 'Mail',
    category: 'content',
    sidebarItems: ['newsletter'],
    defaultEnabled: true,
    status: 'installed',
    version: '1.0.0',
    author: 'ClawCMS',
    tags: ['email', 'marketing'],
  },
  {
    type: 'resume',
    name: 'Resume',
    description: 'Professional resume with experience, education and skills',
    icon: 'BookUser',
    category: 'content',
    sidebarItems: ['resume'],
    defaultEnabled: true,
    status: 'installed',
    version: '1.0.0',
    author: 'ClawCMS',
    tags: ['cv', 'career'],
  },

  // Integrations
  {
    type: 'ai',
    name: 'AI Chat',
    description: 'AI-powered chat with multiple provider support and tool calling',
    icon: 'Bot',
    category: 'integrations',
    sidebarItems: ['chat', 'chat-settings', 'chat-history'],
    defaultEnabled: true,
    status: 'installed',
    version: '2.0.0',
    author: 'ClawCMS',
    tags: ['ai', 'chat', 'agent'],
  },
  {
    type: 'github',
    name: 'GitHub',
    description: 'Display and manage GitHub repositories',
    icon: 'Github',
    category: 'integrations',
    sidebarItems: ['github-repos'],
    defaultEnabled: true,
    status: 'installed',
    version: '1.1.0',
    author: 'ClawCMS',
    tags: ['github', 'repos', 'code'],
  },
  {
    type: 'webhooks',
    name: 'Webhooks',
    description: 'Outgoing webhook notifications for system events',
    icon: 'Webhook',
    category: 'integrations',
    sidebarItems: ['webhooks'],
    defaultEnabled: false,
    status: 'installed',
    version: '1.0.0',
    author: 'ClawCMS',
    tags: ['automation', 'events'],
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
    status: 'installed',
    version: '0.9.0',
    author: 'ClawCMS',
    tags: ['browser', 'capture'],
  },

  // Coming Soon
  {
    type: 'forms',
    name: 'Forms Builder',
    description: 'Drag-and-drop form builder with conditional logic and submissions',
    icon: 'ClipboardList',
    category: 'content',
    sidebarItems: [],
    defaultEnabled: false,
    status: 'coming_soon',
    version: '—',
    author: 'ClawCMS',
    tags: ['forms', 'input'],
  },
  {
    type: 'e_commerce',
    name: 'E-Commerce',
    description: 'Product catalog, cart and checkout with Stripe integration',
    icon: 'ShoppingCart',
    category: 'content',
    sidebarItems: [],
    defaultEnabled: false,
    status: 'coming_soon',
    version: '—',
    author: 'ClawCMS',
    tags: ['shop', 'payments'],
  },
  {
    type: 'multi_language',
    name: 'Multi-Language',
    description: 'i18n support with automatic AI translation and locale routing',
    icon: 'Languages',
    category: 'tools',
    sidebarItems: [],
    defaultEnabled: false,
    status: 'coming_soon',
    version: '—',
    author: 'ClawCMS',
    tags: ['i18n', 'translation'],
  },
  {
    type: 'a2a_federation',
    name: 'A2A Federation',
    description: 'Agent-to-agent communication and federated agent discovery',
    icon: 'Network',
    category: 'integrations',
    sidebarItems: [],
    defaultEnabled: false,
    status: 'coming_soon',
    version: '—',
    author: 'ClawCMS',
    tags: ['agents', 'federation'],
  },
  {
    type: 'crm',
    name: 'CRM',
    description: 'Contact management, pipelines and lead tracking',
    icon: 'Users',
    category: 'tools',
    sidebarItems: [],
    defaultEnabled: false,
    status: 'coming_soon',
    version: '—',
    author: 'ClawCMS',
    tags: ['sales', 'contacts'],
  },
];

// Only installed modules (for sidebar filtering etc.)
export const installedModules = moduleRegistry.filter((m) => m.status === 'installed');

// Quick lookup by module type
export const moduleRegistryMap = new Map(
  moduleRegistry.map((m) => [m.type, m])
);

// Get all sidebar item IDs that should be hidden when their module is disabled
export const getHiddenSidebarItems = (
  modules: Array<{ module_type: string; enabled: boolean | null }>
): Set<string> => {
  const hidden = new Set<string>();

  for (const entry of installedModules) {
    if (entry.locked) continue;

    const dbModule = modules.find((m) => m.module_type === entry.type);
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
