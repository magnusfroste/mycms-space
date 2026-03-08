// ============================================
// Module Registry
// Metadata for all available modules
// Maps modules to sidebar items & display info
// ============================================

import type { ModuleType } from '@/types/modules';

export type ModuleStatus = 'installed' | 'coming_soon';

export interface ModuleChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export interface ModuleRegistryEntry {
  type: ModuleType | string;
  name: string;
  description: string;
  longDescription?: string;
  icon: string;
  category: 'core' | 'content' | 'integrations' | 'tools';
  sidebarItems: string[];
  locked?: boolean;
  defaultEnabled: boolean;
  status: ModuleStatus;
  version: string;
  author?: string;
  tags?: string[];
  dependencies?: string[]; // other module types this depends on
  configTab?: string; // admin tab to link to for configuration
  changelog?: ModuleChangelogEntry[];
}

export const moduleRegistry: ModuleRegistryEntry[] = [
  // Core — always on
  // Core — always on
  {
    type: 'header',
    name: 'Header',
    description: 'Site header with logo and navigation',
    longDescription: 'Configurable site header with logo, navigation links, and responsive mobile menu. Supports sticky positioning and transparent overlay on hero sections.',
    icon: 'PanelTop',
    category: 'core',
    sidebarItems: ['navigation'],
    locked: true,
    defaultEnabled: true,
    status: 'installed',
    version: '1.0.0',
    author: 'ClawCMS',
    tags: ['layout', 'navigation'],
    configTab: 'navigation',
    changelog: [
      { version: '1.0.0', date: '2025-01-15', changes: ['Initial release with logo, nav links and mobile menu'] },
    ],
  },
  {
    type: 'footer',
    name: 'Footer',
    description: 'Site footer with social links and copyright',
    longDescription: 'Customizable footer with dynamic copyright year, social media links, and configurable layout.',
    icon: 'PanelBottom',
    category: 'core',
    sidebarItems: [],
    locked: true,
    defaultEnabled: true,
    status: 'installed',
    version: '1.0.0',
    author: 'ClawCMS',
    tags: ['layout', 'social'],
    changelog: [
      { version: '1.0.0', date: '2025-01-15', changes: ['Initial release'] },
    ],
  },
  {
    type: 'branding',
    name: 'Branding',
    description: 'Theme, colors and visual identity',
    longDescription: 'Control the visual identity of your site. Choose from curated themes (Elegant, Grok, Sana, Terminal) that affect typography, colors and overall feel.',
    icon: 'Palette',
    category: 'core',
    sidebarItems: ['branding'],
    locked: true,
    defaultEnabled: true,
    status: 'installed',
    version: '1.0.0',
    author: 'ClawCMS',
    tags: ['theme', 'design'],
    configTab: 'branding',
    changelog: [
      { version: '1.0.0', date: '2025-01-15', changes: ['Initial release with 4 theme presets'] },
    ],
  },
  {
    type: 'seo',
    name: 'SEO & AIEO',
    description: 'Search engine optimization and AI engine optimization',
    longDescription: 'Manage meta tags, Open Graph images, sitemaps, robots.txt and Google Analytics. Includes AI Engine Optimization (AIEO) for LLM discoverability via llms.txt.',
    icon: 'Search',
    category: 'core',
    sidebarItems: ['seo-module'],
    locked: true,
    defaultEnabled: true,
    status: 'installed',
    version: '1.1.0',
    author: 'ClawCMS',
    tags: ['seo', 'ai', 'search'],
    configTab: 'seo-module',
    changelog: [
      { version: '1.1.0', date: '2025-03-01', changes: ['Added AIEO with llms.txt support'] },
      { version: '1.0.0', date: '2025-01-15', changes: ['Initial release with meta tags and sitemap'] },
    ],
  },
  {
    type: 'analytics',
    name: 'Analytics',
    description: 'Page views, project views and chat session tracking',
    longDescription: 'Built-in analytics dashboard tracking page views, unique visitors, chat sessions and referral sources. No external service required.',
    icon: 'BarChart3',
    category: 'core',
    sidebarItems: ['dashboard'],
    locked: true,
    defaultEnabled: true,
    status: 'installed',
    version: '1.0.0',
    author: 'ClawCMS',
    tags: ['analytics', 'tracking'],
    configTab: 'dashboard',
    changelog: [
      { version: '1.0.0', date: '2025-01-15', changes: ['Initial release with page view tracking'] },
    ],
  },

  // Content
  {
    type: 'projects',
    name: 'Projects',
    description: 'Project showcase with categories, layouts and detail pages',
    longDescription: 'Display projects with multiple layout styles (alternating, grid, carousel, masonry). Supports categories, detail pages with case studies, image galleries and tech stack badges.',
    icon: 'FolderOpen',
    category: 'content',
    sidebarItems: ['projects-module'],
    defaultEnabled: true,
    status: 'installed',
    version: '1.2.0',
    author: 'ClawCMS',
    tags: ['portfolio', 'showcase'],
    configTab: 'projects-module',
    changelog: [
      { version: '1.2.0', date: '2025-02-20', changes: ['Added masonry layout', 'Image gallery support'] },
      { version: '1.1.0', date: '2025-02-01', changes: ['Category filtering', 'Detail page routing'] },
      { version: '1.0.0', date: '2025-01-15', changes: ['Initial release'] },
    ],
  },
  {
    type: 'blog',
    name: 'Blog',
    description: 'Blog posts with categories, SEO and scheduling',
    longDescription: 'Full blogging engine with rich text editing, categories, cover images (Unsplash integration), SEO fields, reading time estimation and post scheduling.',
    icon: 'PenSquare',
    category: 'content',
    sidebarItems: ['blog', 'blog-module'],
    defaultEnabled: true,
    status: 'installed',
    version: '1.3.0',
    author: 'ClawCMS',
    tags: ['content', 'publishing'],
    configTab: 'blog',
    changelog: [
      { version: '1.3.0', date: '2025-03-05', changes: ['Post scheduling', 'AI-generated drafts'] },
      { version: '1.2.0', date: '2025-02-15', changes: ['Category management', 'Unsplash integration'] },
      { version: '1.0.0', date: '2025-01-15', changes: ['Initial release'] },
    ],
  },
  {
    type: 'newsletter',
    name: 'Newsletter',
    description: 'Email newsletter with subscriber management',
    longDescription: 'Manage newsletter subscribers and send campaigns via Resend. Includes subscriber import/export, campaign analytics and agent-assisted drafting.',
    icon: 'Mail',
    category: 'content',
    sidebarItems: ['newsletter'],
    defaultEnabled: true,
    status: 'installed',
    version: '1.0.0',
    author: 'ClawCMS',
    tags: ['email', 'marketing'],
    configTab: 'newsletter',
    changelog: [
      { version: '1.0.0', date: '2025-01-15', changes: ['Initial release with Resend integration'] },
    ],
  },
  {
    type: 'resume',
    name: 'Resume',
    description: 'Professional resume with experience, education and skills',
    longDescription: 'Structured resume management with categories for experience, education, certifications and skills. Supports date ranges, tags and ordering. Powers the CV Agent tool.',
    icon: 'BookUser',
    category: 'content',
    sidebarItems: ['resume'],
    defaultEnabled: true,
    status: 'installed',
    version: '1.0.0',
    author: 'ClawCMS',
    tags: ['cv', 'career'],
    configTab: 'resume',
    dependencies: ['ai'],
    changelog: [
      { version: '1.0.0', date: '2025-01-15', changes: ['Initial release'] },
    ],
  },

  // Integrations
  {
    type: 'ai',
    name: 'AI Chat',
    description: 'AI-powered chat with multiple provider support and tool calling',
    longDescription: 'Agentic AI chat supporting multiple providers (OpenAI, Gemini, n8n, self-hosted). Features tool calling, visitor context, admin co-pilot mode and configurable personality.',
    icon: 'Bot',
    category: 'integrations',
    sidebarItems: ['chat', 'chat-settings', 'chat-history'],
    defaultEnabled: true,
    status: 'installed',
    version: '2.0.0',
    author: 'ClawCMS',
    tags: ['ai', 'chat', 'agent'],
    configTab: 'chat-settings',
    changelog: [
      { version: '2.0.0', date: '2025-03-01', changes: ['Multi-provider architecture', 'Tool calling for all providers', 'Admin co-pilot mode'] },
      { version: '1.0.0', date: '2025-01-15', changes: ['Initial release with n8n webhook support'] },
    ],
  },
  {
    type: 'github',
    name: 'GitHub',
    description: 'Display and manage GitHub repositories',
    longDescription: 'Sync and display GitHub repositories with AI-enriched descriptions. Supports multiple layouts, topic filtering, star/fork counts and repository image galleries.',
    icon: 'Github',
    category: 'integrations',
    sidebarItems: ['github-repos'],
    defaultEnabled: true,
    status: 'installed',
    version: '1.1.0',
    author: 'ClawCMS',
    tags: ['github', 'repos', 'code'],
    configTab: 'github-repos',
    changelog: [
      { version: '1.1.0', date: '2025-02-10', changes: ['AI-enriched descriptions', 'Image galleries'] },
      { version: '1.0.0', date: '2025-01-15', changes: ['Initial release with repo sync'] },
    ],
  },
  {
    type: 'webhooks',
    name: 'Webhooks',
    description: 'Outgoing webhook notifications for system events',
    longDescription: 'Configure outgoing webhooks for system events like contact form submissions, newsletter signups, blog publications and chat sessions. Integrates with any HTTP endpoint.',
    icon: 'Webhook',
    category: 'integrations',
    sidebarItems: ['webhooks'],
    defaultEnabled: false,
    status: 'installed',
    version: '1.0.0',
    author: 'ClawCMS',
    tags: ['automation', 'events'],
    configTab: 'webhooks',
    changelog: [
      { version: '1.0.0', date: '2025-02-01', changes: ['Initial release with 4 event types'] },
    ],
  },

  // Tools
  {
    type: 'chrome_extension',
    name: 'Chrome Extension',
    description: 'Browser extension bridge for content capture',
    longDescription: 'Connect a Chrome extension to capture content from LinkedIn, GitHub and other sites. Includes auto-reconnect, domain allowlisting and real-time status monitoring.',
    icon: 'Globe',
    category: 'tools',
    sidebarItems: ['chrome-extension'],
    defaultEnabled: false,
    status: 'installed',
    version: '0.9.0',
    author: 'ClawCMS',
    tags: ['browser', 'capture'],
    configTab: 'chrome-extension',
    changelog: [
      { version: '0.9.0', date: '2025-03-08', changes: ['Auto-reconnect mechanism', 'Domain allowlisting'] },
    ],
  },

  // Coming Soon
  {
    type: 'forms',
    name: 'Forms Builder',
    description: 'Drag-and-drop form builder with conditional logic and submissions',
    longDescription: 'Build custom forms with a visual editor. Support for text, select, checkbox, file upload fields with conditional visibility rules and submission webhooks.',
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
    longDescription: 'Full e-commerce solution with product catalog, shopping cart, Stripe checkout and order management.',
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
    longDescription: 'Internationalization with AI-powered automatic translation, locale-based routing and language switcher component.',
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
    longDescription: 'Enable your AI agent to discover and communicate with other agents using the A2A protocol. Supports capability negotiation and task delegation.',
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
    longDescription: 'Lightweight CRM with contact management, deal pipelines, activity tracking and integration with the chat and contact form modules.',
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
