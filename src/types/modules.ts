// ============================================
// Module Types
// Generalized module configuration system
// ============================================

// Available module types
export type ModuleType = 'ai' | 'projects' | 'newsletter' | 'analytics' | 'header' | 'footer' | 'blog' | 'seo' | 'github';

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

export type AIIntegrationType = 'n8n' | 'openai' | 'gemini' | 'ollama' | 'lovable';

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

// Ollama Integration (future)
export interface OllamaIntegration extends AIIntegrationBase {
  type: 'ollama';
  base_url: string;
  model: string;
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
  | OllamaIntegration
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
    description: 'Built-in AI using Lovable gateway (no API key needed)',
    icon: 'Sparkles',
    available: true,
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
    description: 'Direct integration with Google Gemini models',
    icon: 'Sparkles',
    available: true,
    docs: 'https://ai.google.dev/docs',
    category: 'ai',
  },
  {
    type: 'ollama',
    name: 'Self-hosted Ollama',
    description: 'Connect to a self-hosted Ollama instance',
    icon: 'Server',
    available: false,
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
    type: 'github',
    name: 'GitHub',
    description: 'Connect your GitHub profile to display repositories',
    icon: 'Github',
    available: true,
    docs: 'https://docs.github.com/en/rest',
    category: 'source',
  },
];

// ============================================
// Utility Integration Types
// ============================================

export type UtilityIntegrationType = 'firecrawl' | 'resend';

// ============================================
// Source Integration Types (GitHub, etc.)
// ============================================

export type SourceIntegrationType = 'github';

export interface SourceIntegrationBase {
  type: SourceIntegrationType;
  enabled: boolean;
}

export interface GitHubSourceIntegration extends SourceIntegrationBase {
  type: 'github';
  username: string;
}

export type SourceIntegration = GitHubSourceIntegration;

export const defaultSourceIntegrations: Record<SourceIntegrationType, SourceIntegration> = {
  github: {
    type: 'github',
    enabled: false,
    username: '',
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

export type UtilityIntegration = FirecrawlIntegration | ResendIntegration;

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
    model: 'gemini-1.5-flash',
  },
  ollama: {
    type: 'ollama',
    enabled: false,
    base_url: 'http://localhost:11434',
    model: 'llama3',
  },
};

// AI Module Config - Updated to use integration system
export interface AIModuleConfig {
  // Active integration
  active_integration: AIIntegrationType;
  integration: AIIntegration;
  
  // System prompt (sent to all providers)
  system_prompt: string;
  
  // Legacy fields (for backwards compatibility)
  webhook_url?: string;
  provider?: 'n8n' | 'custom' | 'lovable';
  
  // Context sources
  include_page_context: boolean;
  selected_page_slugs: string[];
  include_blog_context: boolean;
  selected_blog_ids: string[];
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
  show_theme_toggle: boolean;
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
  | GitHubModuleConfig;

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
}

// Helper type to get config from module type
// Helper type to get config from module type
export type ConfigForModule<T extends ModuleType> = ModuleTypeConfigMap[T];

// Default configs for each module type
export const defaultModuleConfigs: ModuleTypeConfigMap = {
  ai: {
    active_integration: 'n8n',
    integration: defaultIntegrations.n8n,
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
    show_theme_toggle: true,
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
