// ============================================
// Block Configuration Types
// Defines the shape of block_config JSONB for each block type
// ============================================

// Hero Block Config
// About Split Block Config
// Expertise Grid Block Config (Services)
export interface ExpertiseGridBlockConfig {
  title?: string;
  subtitle?: string;
  columns?: 2 | 3;
  items?: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    order_index: number;
    enabled: boolean;
    cta_text?: string;   // "Learn more", "Book now"
    cta_link?: string;   // URL or anchor
  }>;
}

// Skills Bar Block Config
// Values Block Config
// Featured Carousel Block Config
// Project Showcase Block Config
// Chat Widget Block Config
// Text Section Block Config
export interface TextSectionBlockConfig {
  title?: string;
  content?: string;
  alignment?: 'left' | 'center' | 'right';
  background?: 'default' | 'muted' | 'card';
}

// Image Text Block Config
// CTA Banner Block Config
export interface CtaBannerBlockConfig {
  title?: string;
  subtitle?: string;
  button_text?: string;
  button_url?: string;
  /** Optional second, outlined button (studio contact band) */
  secondary_button_text?: string;
  secondary_button_url?: string;
  style?: 'gradient' | 'solid' | 'outline';
}

// Spacer Block Config
// Contact Form Block Config
export interface ContactFormBlockConfig {
  title?: string;
  subtitle?: string;
  success_message?: string;
}

// Bento Grid Block Config
// Stats Counter Block Config
// Testimonial Carousel Block Config
// Marquee Block Config
// Video Hero Block Config
// Parallax Section Block Config
// Blog Block Config
export interface BlogBlockConfig {
  display_mode?: 'latest' | 'featured' | 'category' | 'selected';
  layout?: 'grid' | 'list' | 'cards' | 'magazine';
  posts_count?: number;
  show_excerpt?: boolean;
  show_reading_time?: boolean;
  show_categories?: boolean;
  show_author?: boolean;
  category_filter?: string;
  selected_post_ids?: string[];
  heading?: string;
  subheading?: string;
}

// Newsletter Subscribe Block Config
// GitHub Block Config
export interface GitHubBlockConfig {
  username?: string;
  title?: string;
  subtitle?: string;
  showProfile?: boolean;
  showStats?: boolean;
  showLanguages?: boolean;
  showTopics?: boolean;
  maxRepos?: number;
  layout?: 'grid' | 'list' | 'compact';
  sortBy?: 'pushed' | 'stars' | 'created';
  filterLanguage?: string;
}

// Chat Hero Block Config
export interface ChatHeroBlockConfig {
  agent_name?: string;
  agent_tagline?: string;
  welcome_badge?: string;
  enable_animations?: boolean;
  animation_style?: 'falling-stars' | 'particles' | 'gradient-shift';
  placeholder?: string;
  show_quick_actions?: boolean;
  quick_actions?: Array<{
    id: string;
    label: string;
    message: string;
    icon: string;
    order_index: number;
    enabled: boolean;
  }>;
  // Typewriter settings
  typewriter_speed?: number;   // ms per char, default 40
  enable_sound?: boolean;      // keystroke sound, default false
  /** @deprecated Use agentic greeting instead */
  greeting_messages?: string[];
  // Studio theme: split hero (headline + intro + CTAs) with the chat as a card beside it
  /** Hero H1; falls back to agent_name */
  headline?: string;
  /** One-paragraph introduction under the headline */
  intro?: string;
  /** Text of the availability pill; falls back to the resume module's availability */
  availability_text?: string;
  show_availability?: boolean;
  primary_cta_text?: string;
  primary_cta_url?: string;
  secondary_cta_text?: string;
  secondary_cta_url?: string;
  /** Chat card heading, e.g. "Ask Magnet, my AI twin" */
  card_title?: string;
  card_subtitle?: string;
  card_button_text?: string;
}

// CV Agent Block Config
// Union type for all block configs
export type BlockConfigType =
  | ExpertiseGridBlockConfig
  | TextSectionBlockConfig
  | CtaBannerBlockConfig
  | ContactFormBlockConfig
  | BlogBlockConfig
  | GitHubBlockConfig
  | ChatHeroBlockConfig;

// Agent Status Block Config
// Block type to config mapping for type safety
export interface BlockTypeConfigMap {
  'expertise-grid': ExpertiseGridBlockConfig;
  'chat-hero': ChatHeroBlockConfig;
  'text-section': TextSectionBlockConfig;
  'cta-banner': CtaBannerBlockConfig;
  'contact-form': ContactFormBlockConfig;
  'blog': BlogBlockConfig;
  'github': GitHubBlockConfig;
}

// Helper type to get config type from block type
export type ConfigForBlockType<T extends keyof BlockTypeConfigMap> = BlockTypeConfigMap[T];
