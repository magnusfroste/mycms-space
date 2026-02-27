// ============================================
// Block Configuration Types
// Defines the shape of block_config JSONB for each block type
// ============================================

// Hero Block Config
export interface HeroBlockConfig {
  name?: string;
  tagline?: string;
  features?: Array<{
    text: string;
    icon: string;
  }>;
  enable_animations?: boolean;
  animation_style?: 'falling-stars' | 'particles' | 'gradient-shift' | 'none';
}

// About Split Block Config
export interface AboutSplitBlockConfig {
  name?: string;
  intro_text?: string;
  additional_text?: string;
  image_url?: string;
  image_path?: string;
  /** @deprecated Skills moved to SkillsBarBlock */
  skills?: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
  // Social links for personal branding
  social_links?: Array<{
    platform: 'linkedin' | 'github' | 'twitter' | 'website' | 'email' | 'instagram' | 'youtube';
    url: string;
    enabled: boolean;
  }>;
}

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
export interface SkillsBarBlockConfig {
  title?: string;
  subtitle?: string;
  layout?: 'bars' | 'tags' | 'compact';
  skills?: Array<{
    id: string;
    name: string;
    level: number; // 0-100
    category?: string;
    enabled: boolean;
  }>;
}

// Values Block Config
export interface ValuesBlockConfig {
  title?: string;
  subtitle?: string;
  layout?: 'grid' | 'list' | 'cards';
  values?: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    enabled: boolean;
  }>;
}

// Featured Carousel Block Config
export interface FeaturedCarouselBlockConfig {
  title?: string;
  subtitle?: string;
  items?: Array<{
    id: string;
    title: string;
    description: string;
    image_url?: string;
    image_path?: string;
    order_index: number;
    enabled: boolean;
  }>;
}

// Project Showcase Block Config
export interface ProjectShowcaseBlockConfig {
  section_title?: string;
  section_subtitle?: string;
  section_description?: string;
  show_section?: boolean;
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
    order_index: number;
    enabled: boolean;
  }>;
  projects?: Array<{
    id: string;
    title: string;
    description: string;
    demo_link: string;
    problem_statement?: string;
    why_built?: string;
    order_index: number;
    enabled: boolean;
    images: Array<{
      id: string;
      image_url: string;
      image_path: string;
      order_index: number;
    }>;
    categories: string[]; // slugs
  }>;
}

// Chat Widget Block Config
export interface ChatWidgetBlockConfig {
  title?: string;
  subtitle?: string;
  initial_placeholder?: string;
  active_placeholder?: string;
  show_quick_actions?: boolean;
  quick_actions?: Array<{
    id: string;
    label: string;
    message: string;
    icon: string;
    order_index: number;
    enabled: boolean;
  }>;
}

// Text Section Block Config
export interface TextSectionBlockConfig {
  title?: string;
  content?: string;
  alignment?: 'left' | 'center' | 'right';
  background?: 'default' | 'muted' | 'card';
}

// Image Text Block Config
export interface ImageTextBlockConfig {
  title?: string;
  content?: string;
  image_url?: string;
  image_position?: 'left' | 'right';
}

// CTA Banner Block Config
export interface CtaBannerBlockConfig {
  title?: string;
  subtitle?: string;
  button_text?: string;
  button_url?: string;
  style?: 'gradient' | 'solid' | 'outline';
}

// Spacer Block Config
export interface SpacerBlockConfig {
  height?: 'sm' | 'md' | 'lg' | 'xl';
}

// Contact Form Block Config
export interface ContactFormBlockConfig {
  title?: string;
  subtitle?: string;
  success_message?: string;
}

// Bento Grid Block Config
export interface BentoGridBlockConfig {
  items?: Array<{
    id: string;
    title: string;
    description: string;
    icon?: string;
    size: 'small' | 'medium' | 'large';
    color?: string;
  }>;
}

// Stats Counter Block Config
export interface StatsCounterBlockConfig {
  items?: Array<{
    id: string;
    value: number;
    label: string;
    suffix?: string;
    prefix?: string;
  }>;
}

// Testimonial Carousel Block Config
export interface TestimonialCarouselBlockConfig {
  items?: Array<{
    id: string;
    quote: string;
    author: string;
    role?: string;
    company?: string;
    avatar_url?: string;
  }>;
}

// Marquee Block Config
export interface MarqueeBlockConfig {
  text?: string;
  speed?: 'slow' | 'normal' | 'fast';
  direction?: 'left' | 'right';
}

// Video Hero Block Config
export interface VideoHeroBlockConfig {
  video_url?: string;
  title?: string;
  subtitle?: string;
  overlay_opacity?: number;
}

// Parallax Section Block Config
export interface ParallaxSectionBlockConfig {
  background_image?: string;
  title?: string;
  content?: string;
  height?: 'sm' | 'md' | 'lg';
  text_color?: 'light' | 'dark';
}

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
export interface NewsletterSubscribeBlockConfig {
  heading?: string;
  description?: string;
  buttonText?: string;
  successMessage?: string;
  showNameField?: boolean;
  backgroundColor?: string;
}

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
}

// CV Agent Block Config
export interface CvAgentBlockConfig {
  title?: string;
  subtitle?: string;
  badge_text?: string;
  button_text?: string;
  placeholder?: string;
  features?: string[];
}

// Union type for all block configs
export type BlockConfigType =
  | HeroBlockConfig
  | AboutSplitBlockConfig
  | ExpertiseGridBlockConfig
  | SkillsBarBlockConfig
  | ValuesBlockConfig
  | FeaturedCarouselBlockConfig
  | ProjectShowcaseBlockConfig
  | ChatWidgetBlockConfig
  | TextSectionBlockConfig
  | ImageTextBlockConfig
  | CtaBannerBlockConfig
  | SpacerBlockConfig
  | ContactFormBlockConfig
  | BentoGridBlockConfig
  | StatsCounterBlockConfig
  | TestimonialCarouselBlockConfig
  | MarqueeBlockConfig
  | VideoHeroBlockConfig
  | ParallaxSectionBlockConfig
  | BlogBlockConfig
  | NewsletterSubscribeBlockConfig
  | GitHubBlockConfig
  | ChatHeroBlockConfig
  | CvAgentBlockConfig;

// Block type to config mapping for type safety
export interface BlockTypeConfigMap {
  'hero': HeroBlockConfig;
  'about-split': AboutSplitBlockConfig;
  'expertise-grid': ExpertiseGridBlockConfig;
  'skills-bar': SkillsBarBlockConfig;
  'values': ValuesBlockConfig;
  'featured-carousel': FeaturedCarouselBlockConfig;
  'project-showcase': ProjectShowcaseBlockConfig;
  'chat-widget': ChatWidgetBlockConfig;
  'chat-hero': ChatHeroBlockConfig;
  'text-section': TextSectionBlockConfig;
  'image-text': ImageTextBlockConfig;
  'cta-banner': CtaBannerBlockConfig;
  'spacer': SpacerBlockConfig;
  'contact-form': ContactFormBlockConfig;
  'bento-grid': BentoGridBlockConfig;
  'stats-counter': StatsCounterBlockConfig;
  'testimonial-carousel': TestimonialCarouselBlockConfig;
  'marquee': MarqueeBlockConfig;
  'video-hero': VideoHeroBlockConfig;
  'parallax-section': ParallaxSectionBlockConfig;
  'blog': BlogBlockConfig;
  'newsletter-subscribe': NewsletterSubscribeBlockConfig;
  'github': GitHubBlockConfig;
}

// Helper type to get config type from block type
export type ConfigForBlockType<T extends keyof BlockTypeConfigMap> = BlockTypeConfigMap[T];

// Default configs for each block type
export const defaultBlockConfigs: Partial<BlockTypeConfigMap> = {
  'hero': {
    name: 'Your Name',
    tagline: 'Your Tagline',
    features: [
      { text: 'Feature 1', icon: 'Rocket' },
      { text: 'Feature 2', icon: 'BarChart' },
      { text: 'Feature 3', icon: 'Brain' },
    ],
    enable_animations: true,
    animation_style: 'falling-stars',
  },
  'chat-hero': {
    agent_name: 'AI Assistant',
    agent_tagline: 'How can I help you today?',
    welcome_badge: 'Welcome',
    enable_animations: true,
    animation_style: 'falling-stars',
    placeholder: 'Ask me anything...',
    show_quick_actions: true,
    quick_actions: [],
  },
  'about-split': {
    name: 'Your Name',
    intro_text: 'Your introduction text here...',
    additional_text: 'Additional information about you...',
    skills: [
      { title: 'Skill 1', description: 'Description', icon: 'Monitor' },
      { title: 'Skill 2', description: 'Description', icon: 'Rocket' },
      { title: 'Skill 3', description: 'Description', icon: 'Brain' },
    ],
  },
  'expertise-grid': {
    items: [],
  },
  'featured-carousel': {
    items: [],
  },
  'project-showcase': {
    section_title: 'Portfolio',
    show_section: true,
    projects: [],
    categories: [],
  },
  'chat-widget': {
    show_quick_actions: true,
    quick_actions: [],
  },
  'text-section': {
    title: 'Section Title',
    content: 'Section content goes here...',
    alignment: 'center',
    background: 'default',
  },
  'image-text': {
    title: 'Image Title',
    content: 'Content next to the image...',
    image_position: 'left',
  },
  'cta-banner': {
    title: 'Ready to get started?',
    subtitle: 'Contact us today',
    button_text: 'Get Started',
    button_url: '/contact',
    style: 'gradient',
  },
  'spacer': {
    height: 'md',
  },
  'contact-form': {
    title: 'Contact Us',
    success_message: 'Thanks for reaching out!',
  },
  'bento-grid': {
    items: [],
  },
  'stats-counter': {
    items: [],
  },
  'testimonial-carousel': {
    items: [],
  },
  'marquee': {
    text: 'Your scrolling text here',
    speed: 'normal',
    direction: 'left',
  },
  'video-hero': {
    title: 'Video Title',
    overlay_opacity: 0.5,
  },
  'parallax-section': {
    background_image: '',
    title: 'Parallax Title',
    content: '',
    height: 'md',
    text_color: 'light',
  },
  'blog': {
    display_mode: 'latest',
    layout: 'grid',
    posts_count: 6,
    show_excerpt: true,
    show_reading_time: true,
    show_categories: true,
    show_author: false,
    heading: 'Latest Posts',
    subheading: '',
  },
  'newsletter-subscribe': {
    heading: 'Subscribe to Newsletter',
    description: 'Get the latest news directly to your inbox.',
    buttonText: 'Subscribe',
    successMessage: 'Thank you for subscribing!',
    showNameField: false,
    backgroundColor: '',
  },
  'github': {
    username: '',
    title: 'Open Source Projects',
    subtitle: 'My contributions to the community',
    showProfile: true,
    showStats: true,
    showLanguages: true,
    showTopics: true,
    maxRepos: 6,
    layout: 'grid',
    sortBy: 'pushed',
  },
};
