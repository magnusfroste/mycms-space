// ============================================
// Module Types
// Generalized module configuration system
// ============================================

// Available module types
export type ModuleType = 'ai' | 'projects' | 'newsletter' | 'analytics';

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

// Union type for all configs
export type ModuleConfigType =
  | AIModuleConfig
  | ProjectsModuleConfig
  | NewsletterModuleConfig
  | AnalyticsModuleConfig;

// Type-safe mapping
export interface ModuleTypeConfigMap {
  ai: AIModuleConfig;
  projects: ProjectsModuleConfig;
  newsletter: NewsletterModuleConfig;
  analytics: AnalyticsModuleConfig;
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
};

// Type guard for module config
export const isAIModuleConfig = (config: ModuleConfigType): config is AIModuleConfig => {
  return 'webhook_url' in config;
};

export const isProjectsModuleConfig = (config: ModuleConfigType): config is ProjectsModuleConfig => {
  return 'layout_style' in config;
};
