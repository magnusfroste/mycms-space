// ============================================
// Blog Types
// Types for blog posts, categories, and block config
// ============================================

// Blog Post Status
export type BlogPostStatus = 'draft' | 'published' | 'scheduled';

// Blog Post
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  cover_image_url?: string;
  cover_image_path?: string;
  author_name: string;
  author_avatar_url?: string;
  reading_time_minutes: number;
  status: BlogPostStatus;
  published_at?: string;
  scheduled_for?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  featured: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
  // Joined categories (optional, populated by queries)
  categories?: BlogCategory[];
}

// Blog Category
export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  order_index: number;
  enabled: boolean;
  created_at: string;
}

// Blog Post Category Junction
export interface BlogPostCategory {
  post_id: string;
  category_id: string;
}

// Create/Update inputs
export interface CreateBlogPostInput {
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  cover_image_url?: string;
  cover_image_path?: string;
  author_name?: string;
  author_avatar_url?: string;
  reading_time_minutes?: number;
  status?: BlogPostStatus;
  published_at?: string;
  scheduled_for?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  featured?: boolean;
  order_index?: number;
  category_ids?: string[];
}

export interface UpdateBlogPostInput extends Partial<CreateBlogPostInput> {
  id: string;
}

export interface CreateBlogCategoryInput {
  name: string;
  slug: string;
  description?: string;
  order_index?: number;
  enabled?: boolean;
}

export interface UpdateBlogCategoryInput extends Partial<CreateBlogCategoryInput> {
  id: string;
}

// Blog Block Config (for page_blocks)
export interface BlogBlockConfig {
  display_mode?: 'latest' | 'featured' | 'category' | 'selected';
  layout?: 'grid' | 'list' | 'cards' | 'magazine';
  posts_count?: number;
  show_excerpt?: boolean;
  show_reading_time?: boolean;
  show_categories?: boolean;
  show_author?: boolean;
  category_filter?: string; // category slug
  selected_post_ids?: string[];
  heading?: string;
  subheading?: string;
}

// Default blog block config
export const defaultBlogBlockConfig: BlogBlockConfig = {
  display_mode: 'latest',
  layout: 'grid',
  posts_count: 6,
  show_excerpt: true,
  show_reading_time: true,
  show_categories: true,
  show_author: false,
  heading: 'Latest Posts',
  subheading: '',
};

// Helper to calculate reading time from content
export const calculateReadingTime = (content: string): number => {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
};

// Helper to generate slug from title
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};
