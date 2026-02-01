// ============================================
// Model Layer: Blog
// React Query hooks for blog posts and categories
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import {
  fetchBlogPosts,
  fetchBlogPostBySlug,
  fetchBlogPostById,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  fetchBlogCategories,
  fetchBlogCategoryBySlug,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  subscribeToBlogPosts,
  subscribeToBlogCategories,
} from '@/data/blog';
import type {
  BlogPost,
  BlogCategory,
  CreateBlogPostInput,
  UpdateBlogPostInput,
  CreateBlogCategoryInput,
  UpdateBlogCategoryInput,
} from '@/types/blog';

// Query keys
export const blogKeys = {
  all: ['blog'] as const,
  posts: () => [...blogKeys.all, 'posts'] as const,
  postsList: (filters?: Record<string, unknown>) => [...blogKeys.posts(), 'list', filters] as const,
  postBySlug: (slug: string) => [...blogKeys.posts(), 'slug', slug] as const,
  postById: (id: string) => [...blogKeys.posts(), 'id', id] as const,
  categories: () => [...blogKeys.all, 'categories'] as const,
  categoryBySlug: (slug: string) => [...blogKeys.categories(), 'slug', slug] as const,
};

// ============================================
// Blog Posts Hooks
// ============================================

export const useBlogPosts = (options?: {
  status?: 'draft' | 'published' | 'scheduled';
  featured?: boolean;
  categorySlug?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: blogKeys.postsList(options),
    queryFn: () => fetchBlogPosts(options),
  });
};

export const useBlogPostBySlug = (slug: string) => {
  return useQuery({
    queryKey: blogKeys.postBySlug(slug),
    queryFn: () => fetchBlogPostBySlug(slug),
    enabled: !!slug,
  });
};

export const useBlogPostById = (id: string) => {
  return useQuery({
    queryKey: blogKeys.postById(id),
    queryFn: () => fetchBlogPostById(id),
    enabled: !!id,
  });
};

export const useCreateBlogPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBlogPostInput) => createBlogPost(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.posts() });
    },
  });
};

export const useUpdateBlogPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateBlogPostInput) => updateBlogPost(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: blogKeys.posts() });
      queryClient.setQueryData(blogKeys.postById(data.id), data);
      queryClient.setQueryData(blogKeys.postBySlug(data.slug), data);
    },
  });
};

export const useDeleteBlogPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteBlogPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.posts() });
    },
  });
};

// ============================================
// Blog Categories Hooks
// ============================================

export const useBlogCategories = (includeDisabled = false) => {
  return useQuery({
    queryKey: [...blogKeys.categories(), { includeDisabled }],
    queryFn: () => fetchBlogCategories(includeDisabled),
  });
};

export const useBlogCategoryBySlug = (slug: string) => {
  return useQuery({
    queryKey: blogKeys.categoryBySlug(slug),
    queryFn: () => fetchBlogCategoryBySlug(slug),
    enabled: !!slug,
  });
};

export const useCreateBlogCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBlogCategoryInput) => createBlogCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.categories() });
    },
  });
};

export const useUpdateBlogCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateBlogCategoryInput) => updateBlogCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.categories() });
    },
  });
};

export const useDeleteBlogCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteBlogCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.categories() });
    },
  });
};

// ============================================
// Realtime Subscriptions
// ============================================

export const useBlogPostsSubscription = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribeToBlogPosts(() => {
      queryClient.invalidateQueries({ queryKey: blogKeys.posts() });
    });

    return unsubscribe;
  }, [queryClient]);
};

export const useBlogCategoriesSubscription = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribeToBlogCategories(() => {
      queryClient.invalidateQueries({ queryKey: blogKeys.categories() });
    });

    return unsubscribe;
  }, [queryClient]);
};

// Re-export types
export type { BlogPost, BlogCategory, CreateBlogPostInput, UpdateBlogPostInput };
