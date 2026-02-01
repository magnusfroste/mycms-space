// ============================================
// Module Types
// Generalized module configuration system
// ============================================

// Available module types
export type ModuleType = 'ai' | 'projects' | 'newsletter' | 'analytics' | 'header' | 'footer';

// Base module interface
export interface Module<T extends ModuleConfigType = ModuleConfigType> {
  id: string;
  module_type: ModuleType;
  module_config: T;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

// AI Module Config
export interface AIModuleConfig {
  webhook_url: string;
  provider: 'n8n' | 'custom' | 'lovable';
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

// Union type for all configs
export type ModuleConfigType =
  | AIModuleConfig
  | ProjectsModuleConfig
  | NewsletterModuleConfig
  | AnalyticsModuleConfig
  | HeaderModuleConfig
  | FooterModuleConfig;

// Type-safe mapping
export interface ModuleTypeConfigMap {
  ai: AIModuleConfig;
  projects: ProjectsModuleConfig;
  newsletter: NewsletterModuleConfig;
  analytics: AnalyticsModuleConfig;
  header: HeaderModuleConfig;
  footer: FooterModuleConfig;
}

// Helper type to get config from module type
export type ConfigForModule<T extends ModuleType> = ModuleTypeConfigMap[T];

// Default configs for each module type
export const defaultModuleConfigs: ModuleTypeConfigMap = {
  ai: {
    webhook_url: '',
    provider: 'n8n',
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
