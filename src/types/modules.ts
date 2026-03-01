// ============================================
// Module Types
// Generalized module configuration system
// ============================================

// Available module types
export type ModuleType = 'ai' | 'projects' | 'newsletter' | 'analytics' | 'header' | 'footer' | 'blog' | 'seo' | 'github' | 'branding' | 'webhooks';

// Base module interface
export interface Module<T extends ModuleConfigType = ModuleConfigType> {
  id: string;
  module_type: ModuleType;
  module_config: T;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// AI Integration Types
// Extensible integration system for AI providers
// ============================================

export type AIIntegrationType = 'n8n' | 'openai' | 'gemini' | 'custom' | 'lovable';

// Admin AI Provider type (subset - no n8n tool calls)
export type AdminAIProvider = 'lovable' | 'openai' | 'gemini';

// Admin AI Config
export interface AdminAIConfig {
  model?: string;
}

// Base integration interface
export interface AIIntegrationBase {
  type: AIIntegrationType;
  enabled: boolean;
}

// n8n Integration
export interface N8nIntegration extends AIIntegrationBase {
  type: 'n8n';
  webhook_url: string;
  description?: string;
}

// OpenAI Integration (future)
export interface OpenAIIntegration extends AIIntegrationBase {
  type: 'openai';
  model: string;
  api_key_ref?: string; // Reference to secret
}

// Gemini Integration (future)
export interface GeminiIntegration extends AIIntegrationBase {
  type: 'gemini';
  model: string;
  api_key_ref?: string;
}

// Custom Self-hosted Integration (Ollama, LM Studio, vLLM, etc.)
export interface CustomIntegration extends AIIntegrationBase {
  type: 'custom';
  base_url: string;
  model: string;
  api_key_env?: string; // env var name for API key (optional)
}

// Lovable AI Integration (built-in)
export interface LovableIntegration extends AIIntegrationBase {
  type: 'lovable';
  model: string;
}

// Union type for all integrations
export type AIIntegration = 
  | N8nIntegration 
  | OpenAIIntegration 
  | GeminiIntegration 
  | CustomIntegration
  | LovableIntegration;

// Integration metadata for UI
export interface IntegrationMeta {
  type: AIIntegrationType | UtilityIntegrationType | SourceIntegrationType;
  name: string;
  description: string;
  icon: string;
  available: boolean; // Is this integration implemented?
  docs?: string; // Link to documentation
  category: 'ai' | 'utility' | 'source';
}

export const integrationsMeta: IntegrationMeta[] = [
  {
    type: 'n8n',
    name: 'n8n Webhook',
    description: 'Connect to an n8n workflow via webhook for full AI agent control',
    icon: 'Webhook',
    available: true,
    docs: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/',
    category: 'ai',
  },
  {
    type: 'lovable',
    name: 'Lovable AI',
    description: 'Requires Lovable Cloud — not available for self-hosted deployments',
    icon: 'Sparkles',
    available: false,
    category: 'ai',
  },
  {
    type: 'openai',
    name: 'OpenAI',
    description: 'Direct integration with OpenAI GPT models',
    icon: 'Bot',
    available: true,
    docs: 'https://platform.openai.com/docs',
    category: 'ai',
  },
  {
    type: 'gemini',
    name: 'Google Gemini',
    description: 'Direct integration with Google Gemini API (tools supported)',
    icon: 'Sparkles',
    available: true,
    docs: 'https://ai.google.dev/docs',
    category: 'ai',
  },
  {
    type: 'custom',
    name: 'Self-hosted',
    description: 'Any OpenAI-compatible endpoint (Ollama, LM Studio, vLLM)',
    icon: 'Server',
    available: true,
    category: 'ai',
  },
  {
    type: 'firecrawl',
    name: 'Firecrawl',
    description: 'Web scraping and content extraction API',
    icon: 'Globe',
    available: true,
    docs: 'https://docs.firecrawl.dev',
    category: 'utility',
  },
  {
    type: 'resend',
    name: 'Resend',
    description: 'Email API for sending newsletters and transactional emails',
    icon: 'Mail',
    available: true,
    docs: 'https://resend.com/docs',
    category: 'utility',
  },
  {
    type: 'unsplash',
    name: 'Unsplash',
    description: 'Search and use high-quality photos for blog cover images',
    icon: 'Image',
    available: true,
    docs: 'https://unsplash.com/developers',
    category: 'utility',
  },
  {
    type: 'github',
    name: 'GitHub',
    description: 'Connect your GitHub profile to display repositories',
    icon: 'Github',
    available: true,
    docs: 'https://docs.github.com/en/rest',
    category: 'source',
  },
  {
    type: 'gmail',
    name: 'Gmail Signals',
    description: 'Harvest LinkedIn and newsletter signals from Gmail for content generation',
    icon: 'Mail',
    available: true,
    docs: 'https://developers.google.com/gmail/api',
    category: 'source',
  },
];

// ============================================
// Utility Integration Types
// ============================================

export type UtilityIntegrationType = 'firecrawl' | 'resend' | 'unsplash';

// ============================================
// Source Integration Types (GitHub, Gmail, etc.)
// ============================================

export type SourceIntegrationType = 'github' | 'gmail';

export interface SourceIntegrationBase {
  type: SourceIntegrationType;
  enabled: boolean;
}

export interface GitHubSourceIntegration extends SourceIntegrationBase {
  type: 'github';
  username: string;
}

export interface GmailSourceIntegration extends SourceIntegrationBase {
  type: 'gmail';
  email?: string;
  connected?: boolean;
  connected_at?: string;
}

export type SourceIntegration = GitHubSourceIntegration | GmailSourceIntegration;

export const defaultSourceIntegrations: Record<SourceIntegrationType, SourceIntegration> = {
  github: {
    type: 'github',
    enabled: false,
    username: '',
  },
  gmail: {
    type: 'gmail',
    enabled: false,
  },
};

export interface UtilityIntegrationBase {
  type: UtilityIntegrationType;
  enabled: boolean;
}

export interface FirecrawlIntegration extends UtilityIntegrationBase {
  type: 'firecrawl';
  // API key is stored in Supabase secrets
}

export interface ResendIntegration extends UtilityIntegrationBase {
  type: 'resend';
  from_email: string;
  // API key is stored in Supabase secrets as RESEND_API_KEY
}

export interface UnsplashIntegration extends UtilityIntegrationBase {
  type: 'unsplash';
  // API key is stored in Supabase secrets as UNSPLASH_ACCESS_KEY
}

export type UtilityIntegration = FirecrawlIntegration | ResendIntegration | UnsplashIntegration;

export const defaultUtilityIntegrations: Record<UtilityIntegrationType, UtilityIntegration> = {
  firecrawl: {
    type: 'firecrawl',
    enabled: true,
  },
  resend: {
    type: 'resend',
    enabled: true,
    from_email: 'newsletter@froste.eu',
  },
  unsplash: {
    type: 'unsplash',
    enabled: true,
  },
};

// Default integration configs
export const defaultIntegrations: Record<AIIntegrationType, AIIntegration> = {
  n8n: {
    type: 'n8n',
    enabled: false,
    webhook_url: '',
    description: '',
  },
  lovable: {
    type: 'lovable',
    enabled: false,
    model: 'google/gemini-2.5-flash',
  },
  openai: {
    type: 'openai',
    enabled: false,
    model: 'gpt-4o',
  },
  gemini: {
    type: 'gemini',
    enabled: false,
    model: 'gemini-2.5-flash',
  },
  custom: {
    type: 'custom',
    enabled: false,
    base_url: 'http://localhost:11434',
    model: 'llama3',
  },
};

// Magnet Tool Config
export interface MagnetToolConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
}

export const defaultMagnetTools: MagnetToolConfig[] = [
  { id: 'generate_tailored_cv', name: 'CV Agent', description: 'Analyze job descriptions and generate tailored CVs & cover letters', icon: 'FileText', enabled: true },
  { id: 'generate_portfolio', name: 'Portfolio Generator', description: 'Create curated portfolio presentations by theme or technology', icon: 'FolderOpen', enabled: true },
  { id: 'project_deep_dive', name: 'Project Deep Dive', description: 'Provide detailed breakdowns of specific projects', icon: 'Search', enabled: true },
  { id: 'check_availability', name: 'Availability Checker', description: 'Share availability status and engagement types', icon: 'Calendar', enabled: true },
];

// Admin-mode Magnet tools (CMS co-pilot)
export const defaultAdminMagnetTools: MagnetToolConfig[] = [
  { id: 'run_research', name: 'Research Topic', description: 'Research a topic and return structured findings', icon: 'Search', enabled: true },
  { id: 'draft_blog_post', name: 'Draft Blog Post', description: 'Create a blog post draft from a topic or research', icon: 'PenSquare', enabled: true },
  { id: 'draft_all_channels', name: 'Draft All Channels', description: 'Generate multichannel content (blog + LinkedIn + X)', icon: 'Layers', enabled: true },
  { id: 'list_review_queue', name: 'Review Queue', description: 'Show pending tasks awaiting review', icon: 'ClipboardList', enabled: true },
  { id: 'approve_task', name: 'Approve Task', description: 'Approve and publish a pending task', icon: 'CheckCircle', enabled: true },
  { id: 'get_site_stats', name: 'Site Stats', description: 'Get recent analytics summary', icon: 'BarChart', enabled: true },
];

// AI Module Config - Updated to use integration system
export interface AIModuleConfig {
  // Active integration for visitor chat
  active_integration: AIIntegrationType;
  integration: AIIntegration;
  
  // Admin AI tools provider (separate from chat - no tool calls needed)
  admin_ai_provider: AdminAIProvider;
  admin_ai_config?: AdminAIConfig;
  
  // System prompt (sent to all providers)
  system_prompt: string;
  
  // Magnet tools
  magnet_tools?: MagnetToolConfig[];
  
  // Legacy fields (for backwards compatibility)
  webhook_url?: string;
  provider?: 'n8n' | 'custom' | 'lovable';
  
  // Context sources
  include_page_context: boolean;
  selected_page_slugs: string[];
  include_blog_context: boolean;
  selected_blog_ids: string[];
  include_github_context: boolean;
  selected_repo_ids: string[];
}

// Projects Module Config
export interface ProjectsModuleConfig {
  layout_style: 'alternating' | 'grid' | 'carousel' | 'masonry';
  show_categories: boolean;
  link_to_detail_pages: boolean;
  items_per_page: number;
}

// Newsletter Module Config (future)
export interface NewsletterModuleConfig {
  provider: 'mailchimp' | 'convertkit' | 'custom';
  api_key_ref?: string;
  list_id?: string;
}

// Analytics Module Config (future)
export interface AnalyticsModuleConfig {
  track_page_views: boolean;
  track_project_views: boolean;
  track_chat_sessions: boolean;
}

// Header Module Config
export interface HeaderModuleConfig {
  logo_text: string;
  logo_image_url?: string;
  // Future: Re-enable when dark mode is added back
  // show_theme_toggle: boolean;
  sticky: boolean;
  transparent_on_hero: boolean;
}

// Footer Module Config  
export interface SocialLink {
  platform: 'github' | 'linkedin' | 'twitter' | 'instagram' | 'youtube' | 'custom';
  url: string;
  label?: string;
}

export interface FooterModuleConfig {
  copyright_text: string;
  show_social_links: boolean;
  social_links: SocialLink[];
}

// Blog Module Config
export interface BlogModuleConfig {
  posts_per_page: number;
  show_reading_time: boolean;
  show_author: boolean;
  show_categories: boolean;
  default_cover_image: string;
  enable_comments: boolean;
  date_format: string;
}

// SEO Module Config
export interface SEOModuleConfig {
  site_title: string;
  title_template: string;
  site_description: string;
  site_url: string;
  default_og_image: string;
  twitter_handle: string;
  linkedin_url: string;
  // Analytics
  google_analytics_id: string;
}

// GitHub Module Config
export interface GitHubModuleConfig {
  username: string;
  cache_duration_minutes: number;
  auto_sync: boolean;
  sync_interval_hours: number;
  default_layout: 'grid' | 'list' | 'compact';
  default_max_repos: number;
  hide_forked: boolean;
  hide_archived: boolean;
  default_sort_by: 'pushed' | 'stars' | 'created';
  // Display toggles
  show_stars: boolean;
  show_forks: boolean;
  show_languages: boolean;
  show_topics: boolean;
}

// Branding Module Config
export interface BrandingModuleConfig {
  theme: 'elegant' | 'grok' | 'sana' | 'terminal';
  // Future: Re-enable when dark mode is added back
  // force_dark?: boolean;
  // color_mode?: 'light' | 'dark' | 'system';
}

// Webhook Event Types
export type WebhookEventType = 
  | 'contact.message_received'
  | 'newsletter.subscriber_added'
  | 'blog.post_published'
  | 'chat.session_started';

// Webhook Endpoint Config
export interface WebhookEndpoint {
  event_type: WebhookEventType;
  source_module: string;
  url: string;
  enabled: boolean;
  last_triggered?: string;
  last_status?: 'success' | 'error';
  description: string;
}

// Webhooks Module Config
export interface WebhooksModuleConfig {
  endpoints: WebhookEndpoint[];
}

// Union type for all configs
export type ModuleConfigType =
  | AIModuleConfig
  | ProjectsModuleConfig
  | NewsletterModuleConfig
  | AnalyticsModuleConfig
  | HeaderModuleConfig
  | FooterModuleConfig
  | BlogModuleConfig
  | SEOModuleConfig
  | GitHubModuleConfig
  | BrandingModuleConfig
  | WebhooksModuleConfig;

// Type-safe mapping
export interface ModuleTypeConfigMap {
  ai: AIModuleConfig;
  projects: ProjectsModuleConfig;
  newsletter: NewsletterModuleConfig;
  analytics: AnalyticsModuleConfig;
  header: HeaderModuleConfig;
  footer: FooterModuleConfig;
  blog: BlogModuleConfig;
  seo: SEOModuleConfig;
  github: GitHubModuleConfig;
  branding: BrandingModuleConfig;
  webhooks: WebhooksModuleConfig;
}

// Helper type to get config from module type
export type ConfigForModule<T extends ModuleType> = T extends keyof ModuleTypeConfigMap ? ModuleTypeConfigMap[T] : never;

// Default configs for each module type
export const defaultModuleConfigs: ModuleTypeConfigMap = {
  ai: {
    active_integration: 'n8n',
    integration: defaultIntegrations.n8n,
    admin_ai_provider: 'lovable',
    admin_ai_config: {
      model: 'google/gemini-2.5-flash',
    },
    system_prompt: `# Role
You are Magnet, an agentic AI twin of Magnus Froste. You are innovative, creative, and have a great sense of humor! Your biggest interest is product-led AI and the business impact of transformative technology.

# Personality
- Curious about visitors - ask many questions
- Innovative and forward-thinking
- Pedagogical - illustrate with examples
- Professional but approachable

# Conversational Style
- Keep questions and replies short - this is a chat
- When brief, ask if visitor wants more information
- If you don't have an answer, ask a smart question back
- Be enthusiastic about AI and innovation

# Showcase Magnus
- Present resume with role, company name, and year
- Latest experience is most relevant
- Highlight ability to prototype fast (PoC/MVP)

# Market Magnet
- You are an example of the future agentic web
- Promote conversational experiences
- Share what a "Magnet" can do for businesses`,
    webhook_url: '',
    provider: 'n8n',
    include_page_context: false,
    selected_page_slugs: [],
    include_blog_context: false,
    selected_blog_ids: [],
    include_github_context: false,
    selected_repo_ids: [],
  },
  projects: {
    layout_style: 'alternating',
    show_categories: true,
    link_to_detail_pages: true,
    items_per_page: 6,
  },
  newsletter: {
    provider: 'mailchimp',
  },
  analytics: {
    track_page_views: true,
    track_project_views: true,
    track_chat_sessions: true,
  },
  header: {
    logo_text: 'froste.eu',
    logo_image_url: '',
    sticky: true,
    transparent_on_hero: false,
  },
  footer: {
    copyright_text: '© {year} Magnus Froste. All rights reserved.',
    show_social_links: true,
    social_links: [
      { platform: 'github', url: 'https://github.com/magnusfroste' },
      { platform: 'linkedin', url: 'https://linkedin.com/in/magnusfroste' },
      { platform: 'twitter', url: 'https://twitter.com/magnusfroste' },
    ],
  },
  blog: {
    posts_per_page: 10,
    show_reading_time: true,
    show_author: true,
    show_categories: true,
    default_cover_image: '',
    enable_comments: false,
    date_format: 'MMMM d, yyyy',
  },
  seo: {
    site_title: 'Magnus Froste',
    title_template: '%s | Magnus Froste',
    site_description: 'Innovation Strategist and Agentic AI Expert',
    site_url: 'https://www.froste.eu',
    default_og_image: '/og-image.png',
    twitter_handle: '@magnusfroste',
    linkedin_url: 'https://linkedin.com/in/magnusfroste',
    google_analytics_id: '',
  },
  github: {
    username: 'magnusfroste',
    cache_duration_minutes: 60,
    auto_sync: false,
    sync_interval_hours: 24,
    default_layout: 'grid',
    default_max_repos: 6,
    hide_forked: true,
    hide_archived: true,
    default_sort_by: 'pushed',
    show_stars: true,
    show_forks: true,
    show_languages: true,
    show_topics: true,
  },
  branding: {
    theme: 'elegant',
  },
  webhooks: {
    endpoints: [
      {
        event_type: 'contact.message_received',
        source_module: 'contact',
        url: '',
        enabled: false,
        description: 'Triggers when a new contact form message is submitted',
      },
      {
        event_type: 'newsletter.subscriber_added',
        source_module: 'newsletter',
        url: '',
        enabled: false,
        description: 'Triggers when a new newsletter subscriber signs up',
      },
      {
        event_type: 'blog.post_published',
        source_module: 'blog',
        url: '',
        enabled: false,
        description: 'Triggers when a blog post is published',
      },
      {
        event_type: 'chat.session_started',
        source_module: 'chat',
        url: '',
        enabled: false,
        description: 'Triggers when a new chat session is started',
      },
    ],
  },
};

// Type guard for module config
export const isAIModuleConfig = (config: ModuleConfigType): config is AIModuleConfig => {
  return 'webhook_url' in config;
};

export const isProjectsModuleConfig = (config: ModuleConfigType): config is ProjectsModuleConfig => {
  return 'layout_style' in config;
};

export const isHeaderModuleConfig = (config: ModuleConfigType): config is HeaderModuleConfig => {
  return 'logo_text' in config;
};

export const isFooterModuleConfig = (config: ModuleConfigType): config is FooterModuleConfig => {
  return 'copyright_text' in config;
};

export const isBlogModuleConfig = (config: ModuleConfigType): config is BlogModuleConfig => {
  return 'posts_per_page' in config && 'show_reading_time' in config;
};

export const isSEOModuleConfig = (config: ModuleConfigType): config is SEOModuleConfig => {
  return 'title_template' in config && 'site_url' in config;
};
