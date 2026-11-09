// ============================================
// Admin navigation — single source of truth
// Sidebar, command search, breadcrumbs and legacy ?tab= ids all read from here.
// ============================================

export type AdminViewId =
  | 'overview'
  | 'review'
  | 'agents'
  | 'magnet'
  | 'knowledge'
  | 'blog'
  | 'projects'
  | 'pages'
  | 'media'
  | 'newsletter'
  | 'inbox'
  | 'conversations'
  | 'analytics'
  | 'integrations'
  | 'modules'
  | 'site-settings'
  | 'activity'
  | 'chat';

export interface AdminNavItem {
  id: AdminViewId;
  label: string;
  /** One sentence shown in command search and as the page description fallback. */
  description: string;
  /** Extra words that should match in command search. */
  keywords?: string[];
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: '',
    items: [
      { id: 'overview', label: 'Overview', description: 'How the site is doing and what needs you.', keywords: ['dashboard', 'home'] },
      { id: 'review', label: 'Review queue', description: 'Work proposed by Autopilot, waiting for a decision.', keywords: ['approve', 'drafts', 'tasks'] },
    ],
  },
  {
    label: 'Agents',
    items: [
      { id: 'agents', label: 'Operators & Autopilot', description: 'MCP keys for external agents and the internal Autopilot loop.', keywords: ['mcp', 'keys', 'autopilot', 'agency', 'skills', 'automations', 'objectives'] },
      { id: 'magnet', label: 'Magnet (public chat)', description: 'Model, prompt and tools for the AI twin on the site.', keywords: ['chat', 'ai', 'prompt', 'model'] },
    ],
  },
  {
    label: 'Content',
    items: [
      { id: 'knowledge', label: 'Knowledge base', description: 'Profile and documents that Magnet and operators answer from.', keywords: ['resume', 'cv', 'profile'] },
      { id: 'blog', label: 'Blog', description: 'Posts, categories and blog settings.', keywords: ['posts', 'articles'] },
      { id: 'projects', label: 'Projects', description: 'GitHub repositories shown as project pages.', keywords: ['github', 'repos', 'portfolio'] },
      { id: 'pages', label: 'Pages', description: 'Pages and the blocks they are made of.', keywords: ['blocks', 'landing'] },
      { id: 'media', label: 'Media', description: 'Images and files used across the site.', keywords: ['images', 'files', 'uploads'] },
      { id: 'newsletter', label: 'Newsletter', description: 'Subscribers and campaigns.', keywords: ['email', 'subscribers'] },
    ],
  },
  {
    label: 'Audience',
    items: [
      { id: 'inbox', label: 'Inbox', description: 'Messages sent through the contact form.', keywords: ['messages', 'contact', 'leads'] },
      { id: 'conversations', label: 'Conversations', description: 'What visitors asked Magnet.', keywords: ['chat history', 'sessions'] },
      { id: 'analytics', label: 'Analytics', description: 'Visits, pages and chat sessions over time.', keywords: ['stats', 'traffic'] },
    ],
  },
  {
    label: 'Platform',
    items: [
      { id: 'integrations', label: 'Integrations', description: 'External services the site and agents depend on.', keywords: ['openai', 'gemini', 'gmail', 'resend', 'github'] },
      { id: 'modules', label: 'Modules', description: 'Switch features on and off.', keywords: ['features'] },
      { id: 'site-settings', label: 'Site settings', description: 'Navigation, appearance, SEO, webhooks and your profile.', keywords: ['branding', 'seo', 'navigation', 'webhooks', 'profile', 'tokens'] },
      { id: 'activity', label: 'Activity log', description: 'Every change, by you or an agent.', keywords: ['history', 'audit'] },
    ],
  },
];

export const adminNavItems: AdminNavItem[] = adminNavGroups.flatMap((g) => g.items);

const chatItem: AdminNavItem = {
  id: 'chat',
  label: 'Ask Magnet',
  description: 'Chat with Magnet as the admin co-pilot.',
};

export const findNavItem = (id: string): AdminNavItem | undefined =>
  id === 'chat' ? chatItem : adminNavItems.find((i) => i.id === id);

export const findNavGroupLabel = (id: string): string | undefined =>
  adminNavGroups.find((g) => g.items.some((i) => i.id === id))?.label || undefined;

// Site settings sections (inner tabs). Kept here so legacy ids can point at them.
export type SiteSettingsSection =
  | 'navigation'
  | 'appearance'
  | 'seo'
  | 'webhooks'
  | 'chrome-extension'
  | 'profile';

export interface ResolvedRoute {
  view: AdminViewId;
  section?: string;
}

/**
 * Old `?tab=` ids from the previous admin, mapped to the new structure so
 * bookmarks and links from agents (e.g. "/admin?tab=blog&editPostId=…") keep working.
 */
const legacyTabs: Record<string, ResolvedRoute> = {
  dashboard: { view: 'overview' },
  agency: { view: 'agents' },
  'skill-hub': { view: 'agents' },
  autopilot: { view: 'agents' },
  'chat-settings': { view: 'magnet' },
  'ai-module': { view: 'magnet' },
  'blog-module': { view: 'blog', section: 'settings' },
  'github-repos': { view: 'projects', section: 'repos' },
  'projects-module': { view: 'projects', section: 'settings' },
  'seo-module': { view: 'site-settings', section: 'seo' },
  branding: { view: 'site-settings', section: 'appearance' },
  'global-blocks': { view: 'site-settings', section: 'appearance' },
  navigation: { view: 'site-settings', section: 'navigation' },
  webhooks: { view: 'site-settings', section: 'webhooks' },
  'chrome-extension': { view: 'site-settings', section: 'chrome-extension' },
  settings: { view: 'site-settings', section: 'profile' },
  profile: { view: 'site-settings', section: 'profile' },
  'chat-history': { view: 'conversations' },
  messages: { view: 'inbox' },
  resume: { view: 'knowledge' },
  landing: { view: 'pages' },
  history: { view: 'activity' },
  'media-hub': { view: 'media' },
};

export const resolveAdminRoute = (tab: string | null, section: string | null): ResolvedRoute => {
  if (!tab) return { view: 'overview' };
  const legacy = legacyTabs[tab];
  if (legacy) return { view: legacy.view, section: section ?? legacy.section };
  if (findNavItem(tab)) return { view: tab as AdminViewId, section: section ?? undefined };
  return { view: 'overview' };
};

export const MCP_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mcp-server`;
