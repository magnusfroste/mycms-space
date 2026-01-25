// ============================================
// Shared Type Definitions
// ============================================

// Project Types
export interface ProjectImage {
  id: string;
  project_id: string;
  image_url: string;
  image_path: string;
  order_index: number;
  created_at: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  demo_link: string;
  problem_statement?: string | null;
  why_built?: string | null;
  order_index: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  images?: ProjectImage[];
}

export interface CreateProjectInput {
  title: string;
  description: string;
  demo_link: string;
  problem_statement?: string;
  why_built?: string;
  order_index: number;
  enabled?: boolean;
  images?: File[];
}

export interface UpdateProjectInput {
  id: string;
  title?: string;
  description?: string;
  demo_link?: string;
  problem_statement?: string;
  why_built?: string;
  order_index?: number;
  enabled?: boolean;
  newImages?: File[];
}

// Hero Types
export interface HeroSettings {
  id: string;
  name: string;
  tagline: string;
  feature1: string;
  feature1_icon: string;
  feature2: string;
  feature2_icon: string;
  feature3: string;
  feature3_icon: string;
  enable_animations: boolean;
  animation_style: 'falling-stars' | 'particles' | 'gradient-shift' | 'none';
}

// About Me Types
export interface AboutMeSettings {
  id: string;
  name: string;
  intro_text: string;
  additional_text: string;
  skill1_title: string;
  skill1_description: string;
  skill1_icon: string;
  skill2_title: string;
  skill2_description: string;
  skill2_icon: string;
  skill3_title: string;
  skill3_description: string;
  skill3_icon: string;
  image_url: string;
  image_path?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateAboutMeInput {
  name?: string;
  intro_text?: string;
  additional_text?: string;
  skill1_title?: string;
  skill1_description?: string;
  skill1_icon?: string;
  skill2_title?: string;
  skill2_description?: string;
  skill2_icon?: string;
  skill3_title?: string;
  skill3_description?: string;
  skill3_icon?: string;
  image?: File;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  order_index: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Expertise Types
export interface ExpertiseArea {
  id: string;
  title: string;
  description: string;
  icon: string;
  order_index: number;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

// Featured Types
export interface FeaturedItem {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  image_path: string | null;
  order_index: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Quick Actions Types
export interface QuickAction {
  id: string;
  icon: string;
  label: string;
  message: string;
  order_index: number;
  enabled: boolean;
}

// Chat Settings Types
export interface ChatSettings {
  id: string;
  webhook_url: string;
  initial_placeholder: string;
  active_placeholder: string;
  created_at?: string;
  updated_at?: string;
}

// Portfolio Settings Types
export interface PortfolioSettings {
  id: string;
  show_section: boolean;
  section_title: string;
  section_subtitle: string;
  section_description: string;
  created_at: string;
  updated_at: string;
}

// Nav Link Types
export interface NavLink {
  id: string;
  label: string;
  url: string;
  order_index: number;
  enabled: boolean;
  is_external: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNavLinkInput {
  label: string;
  url: string;
  order_index: number;
  enabled?: boolean;
  is_external?: boolean;
}

export interface UpdateNavLinkInput {
  id: string;
  label?: string;
  url?: string;
  order_index?: number;
  enabled?: boolean;
  is_external?: boolean;
}

// Contact Message Type (for future Supabase implementation)
export interface ContactMessage {
  name: string;
  email: string;
  message: string;
}

// ============================================
// Block System Types
// ============================================

export type BlockType =
  | 'hero'
  | 'chat-widget'
  | 'text-section'
  | 'about-split'
  | 'featured-carousel'
  | 'expertise-grid'
  | 'project-showcase'
  | 'image-text'
  | 'cta-banner'
  | 'spacer';

export interface PageBlock {
  id: string;
  page_slug: string;
  block_type: BlockType;
  block_config: Record<string, unknown>;
  order_index: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePageBlockInput {
  page_slug: string;
  block_type: BlockType;
  block_config?: Record<string, unknown>;
  order_index: number;
  enabled?: boolean;
}

export interface UpdatePageBlockInput {
  id: string;
  block_type?: BlockType;
  block_config?: Record<string, unknown>;
  order_index?: number;
  enabled?: boolean;
}
