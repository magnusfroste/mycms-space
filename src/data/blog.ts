// ============================================
// Data Layer: Blog
// Pure Supabase API calls - no UI logic
// ============================================

import { supabase } from '@/integrations/supabase/client';
import type {
  BlogPost,
  BlogCategory,
  CreateBlogPostInput,
  UpdateBlogPostInput,
  CreateBlogCategoryInput,
  UpdateBlogCategoryInput,
} from '@/types/blog';

// ============================================
// Blog Posts
// ============================================

export const fetchBlogPosts = async (options?: {
  status?: 'draft' | 'published' | 'scheduled';
  featured?: boolean;
  categorySlug?: string;
  limit?: number;
  offset?: number;
}): Promise<BlogPost[]> => {
  const limit = options?.limit || 10;
  const offset = options?.offset || 0;

  // If filtering by category, get post IDs first then fetch those posts
  if (options?.categorySlug) {
    // Get category ID from slug
    const { data: category } = await supabase
      .from('blog_categories')
      .select('id')
      .eq('slug', options.categorySlug)
      .maybeSingle();

    if (!category) {
      return []; // Category not found, return empty
    }

    // Get post IDs in this category
    const { data: junctionData } = await supabase
      .from('blog_post_categories')
      .select('post_id')
      .eq('category_id', category.id);

    const postIds = (junctionData || []).map((j) => j.post_id);

    if (postIds.length === 0) {
      return []; // No posts in this category
    }

    // Build query with post IDs filter
    let query = supabase
      .from('blog_posts')
      .select('*')
      .in('id', postIds)
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.featured !== undefined) {
      query = query.eq('featured', options.featured);
    }

    // Apply pagination AFTER filtering
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching blog posts by category:', error);
      throw error;
    }

    return (data || []) as BlogPost[];
  }

  // Standard query without category filter
  let query = supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }
  if (options?.featured !== undefined) {
    query = query.eq('featured', options.featured);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching blog posts:', error);
    throw error;
  }

  return (data || []) as BlogPost[];
};

export const fetchBlogPostBySlug = async (slug: string): Promise<BlogPost | null> => {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('Error fetching blog post:', error);
    throw error;
  }

  if (!data) return null;

  // Fetch categories for this post
  const categoriesResult = await fetchCategoriesForPost(data.id);

  return {
    ...data,
    categories: categoriesResult,
  } as BlogPost;
};

export const fetchBlogPostById = async (id: string): Promise<BlogPost | null> => {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching blog post:', error);
    throw error;
  }

  if (!data) return null;

  const categoriesResult = await fetchCategoriesForPost(data.id);

  return {
    ...data,
    categories: categoriesResult,
  } as BlogPost;
};

export const createBlogPost = async (input: CreateBlogPostInput): Promise<BlogPost> => {
  const { category_ids, ...postData } = input;

  const { data, error } = await supabase
    .from('blog_posts')
    .insert(postData as never)
    .select()
    .single();

  if (error) {
    console.error('Error creating blog post:', error);
    throw error;
  }

  // Add categories if provided
  if (category_ids && category_ids.length > 0) {
    await updatePostCategories(data.id, category_ids);
  }

  return data as BlogPost;
};

export const updateBlogPost = async (input: UpdateBlogPostInput): Promise<BlogPost> => {
  const { id, category_ids, ...updates } = input;

  const { data, error } = await supabase
    .from('blog_posts')
    .update(updates as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating blog post:', error);
    throw error;
  }

  // Update categories if provided
  if (category_ids !== undefined) {
    await updatePostCategories(id, category_ids);
  }

  // Auto-sync: mark related agent tasks as completed when post is published
  if ((updates as any).status === 'published') {
    await syncAgentTaskStatus(id, 'completed');
  }

  return data as BlogPost;
};

export const deleteBlogPost = async (id: string): Promise<void> => {
  const { error } = await supabase.from('blog_posts').delete().eq('id', id);

  if (error) {
    console.error('Error deleting blog post:', error);
    throw error;
  }
};

// ============================================
// Blog Categories
// ============================================

export const fetchBlogCategories = async (includeDisabled = false): Promise<BlogCategory[]> => {
  let query = supabase
    .from('blog_categories')
    .select('*')
    .order('order_index', { ascending: true });

  if (!includeDisabled) {
    query = query.eq('enabled', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching blog categories:', error);
    throw error;
  }

  return (data || []) as BlogCategory[];
};

export const fetchBlogCategoryBySlug = async (slug: string): Promise<BlogCategory | null> => {
  const { data, error } = await supabase
    .from('blog_categories')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('Error fetching blog category:', error);
    throw error;
  }

  return data as BlogCategory | null;
};

export const createBlogCategory = async (input: CreateBlogCategoryInput): Promise<BlogCategory> => {
  const { data, error } = await supabase
    .from('blog_categories')
    .insert(input as never)
    .select()
    .single();

  if (error) {
    console.error('Error creating blog category:', error);
    throw error;
  }

  return data as BlogCategory;
};

export const updateBlogCategory = async (input: UpdateBlogCategoryInput): Promise<BlogCategory> => {
  const { id, ...updates } = input;

  const { data, error } = await supabase
    .from('blog_categories')
    .update(updates as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating blog category:', error);
    throw error;
  }

  return data as BlogCategory;
};

export const deleteBlogCategory = async (id: string): Promise<void> => {
  const { error } = await supabase.from('blog_categories').delete().eq('id', id);

  if (error) {
    console.error('Error deleting blog category:', error);
    throw error;
  }
};

// ============================================
// Post-Category Junction
// ============================================

export const fetchCategoriesForPost = async (postId: string): Promise<BlogCategory[]> => {
  const { data: junctionData, error: junctionError } = await supabase
    .from('blog_post_categories')
    .select('category_id')
    .eq('post_id', postId);

  if (junctionError) {
    console.error('Error fetching post categories:', junctionError);
    return [];
  }

  if (!junctionData || junctionData.length === 0) return [];

  const categoryIds = junctionData.map((j) => j.category_id);

  const { data: categories, error: categoriesError } = await supabase
    .from('blog_categories')
    .select('*')
    .in('id', categoryIds);

  if (categoriesError) {
    console.error('Error fetching categories:', categoriesError);
    return [];
  }

  return (categories || []) as BlogCategory[];
};

export const updatePostCategories = async (
  postId: string,
  categoryIds: string[]
): Promise<void> => {
  // Remove existing categories
  await supabase.from('blog_post_categories').delete().eq('post_id', postId);

  // Add new categories
  if (categoryIds.length > 0) {
    const inserts = categoryIds.map((categoryId) => ({
      post_id: postId,
      category_id: categoryId,
    }));

    const { error } = await supabase.from('blog_post_categories').insert(inserts as never);

    if (error) {
      console.error('Error updating post categories:', error);
      throw error;
    }
  }
};

// ============================================
// Realtime Subscriptions
// ============================================

export const subscribeToBlogPosts = (callback: () => void): (() => void) => {
  const channel = supabase
    .channel('blog_posts_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'blog_posts',
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const subscribeToBlogCategories = (callback: () => void): (() => void) => {
  const channel = supabase
    .channel('blog_categories_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'blog_categories',
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
