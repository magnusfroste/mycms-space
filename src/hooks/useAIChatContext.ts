// ============================================
// useAIChatContext Hook
// Fetches page and blog content for AI context
// ============================================

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAIModule } from '@/models/modules';
import { usePages } from '@/models';
import { useBlogPosts } from '@/models/blog';
import { supabase } from '@/integrations/supabase/client';
import type { PageBlock } from '@/types';

export interface AIContextData {
  pages: Array<{
    slug: string;
    title: string;
    content: string;
    blocks: Array<{
      type: string;
      content: string;
    }>;
  }>;
  blogs: Array<{
    slug: string;
    title: string;
    excerpt?: string;
    content: string;
  }>;
}

/**
 * Extract text content from a block config
 */
const extractBlockContent = (blockType: string, config: Record<string, unknown>): string => {
  const parts: string[] = [];

  // Common text fields across block types
  const textFields = [
    'title', 'subtitle', 'content', 'description', 'heading',
    'text', 'quote', 'author', 'label', 'buttonText', 'ctaText',
    'headline', 'subheadline', 'body', 'caption', 'name', 'role',
    'testimonial', 'message', 'placeholder', 'welcomeMessage'
  ];

  // Extract simple text fields
  for (const field of textFields) {
    if (config[field] && typeof config[field] === 'string') {
      parts.push(config[field] as string);
    }
  }

  // Extract from arrays (items, features, skills, stats, etc.)
  const arrayFields = [
    'items', 'features', 'skills', 'stats', 'testimonials',
    'expertise', 'areas', 'links', 'buttons', 'quickActions'
  ];

  for (const field of arrayFields) {
    if (Array.isArray(config[field])) {
      for (const item of config[field] as Array<Record<string, unknown>>) {
        if (typeof item === 'object' && item !== null) {
          for (const subField of textFields) {
            if (item[subField] && typeof item[subField] === 'string') {
              parts.push(item[subField] as string);
            }
          }
        } else if (typeof item === 'string') {
          parts.push(item);
        }
      }
    }
  }

  // Filter out empty strings and join
  return parts.filter(p => p.trim()).join(' | ');
};

/**
 * Hook to fetch and compile AI context from selected pages and blog posts
 */
export const useAIChatContext = () => {
  const { config: aiConfig, isLoading: aiLoading } = useAIModule();
  const { data: allPages = [], isLoading: pagesLoading } = usePages();
  const { data: allPosts = [], isLoading: postsLoading } = useBlogPosts();

  // Get selected page slugs
  const selectedPageSlugs = aiConfig?.selected_page_slugs || [];
  const includePageContext = aiConfig?.include_page_context ?? false;

  // Get selected blog IDs
  const selectedBlogIds = aiConfig?.selected_blog_ids || [];
  const includeBlogContext = aiConfig?.include_blog_context ?? false;

  // Filter pages based on selection
  const selectedPages = useMemo(() => {
    if (!includePageContext) return [];
    if (selectedPageSlugs.length === 0) {
      return allPages.filter((p) => p.enabled);
    }
    return allPages.filter((p) => selectedPageSlugs.includes(p.slug) && p.enabled);
  }, [includePageContext, selectedPageSlugs, allPages]);

  // Fetch all blocks for selected pages
  const pageSlugsToFetch = selectedPages.map(p => p.slug);
  
  const { data: allBlocks = [], isLoading: blocksLoading } = useQuery({
    queryKey: ['page-blocks-context', pageSlugsToFetch],
    queryFn: async () => {
      if (pageSlugsToFetch.length === 0) return [];
      
      const { data, error } = await supabase
        .from('page_blocks')
        .select('*')
        .in('page_slug', pageSlugsToFetch)
        .eq('enabled', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching blocks for context:', error);
        return [];
      }

      return data as PageBlock[];
    },
    enabled: includePageContext && pageSlugsToFetch.length > 0,
  });

  const isLoading = aiLoading || pagesLoading || postsLoading || blocksLoading;

  // Filter blog posts based on selection
  const selectedBlogs = useMemo(() => {
    if (!includeBlogContext) return [];
    const publishedPosts = allPosts.filter((p) => p.status === 'published');
    if (selectedBlogIds.length === 0) {
      return publishedPosts;
    }
    return publishedPosts.filter((p) => selectedBlogIds.includes(p.id));
  }, [includeBlogContext, selectedBlogIds, allPosts]);

  // Compile context data with block content
  const contextData = useMemo((): AIContextData | null => {
    console.log("[AIContext] Building context:", {
      includePageContext,
      includeBlogContext,
      selectedPages: selectedPages.length,
      selectedBlogs: selectedBlogs.length,
      allBlocksCount: allBlocks.length,
    });
    
    if (!includePageContext && !includeBlogContext) {
      console.log("[AIContext] No context enabled, returning null");
      return null;
    }

    // Group blocks by page slug
    const blocksByPage = new Map<string, PageBlock[]>();
    for (const block of allBlocks) {
      const existing = blocksByPage.get(block.page_slug) || [];
      existing.push(block);
      blocksByPage.set(block.page_slug, existing);
    }

    return {
      pages: selectedPages.map((page) => {
        const pageBlocks = blocksByPage.get(page.slug) || [];
        const blocksContent = pageBlocks.map(block => ({
          type: block.block_type,
          content: extractBlockContent(block.block_type, block.block_config || {}),
        })).filter(b => b.content.trim());

        return {
          slug: page.slug,
          title: page.title,
          content: page.description || '',
          blocks: blocksContent,
        };
      }),
      blogs: selectedBlogs.map((post) => ({
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt || undefined,
        content: post.content,
      })),
    };
  }, [includePageContext, includeBlogContext, selectedPages, selectedBlogs, allBlocks]);

  // Create a summary string for quick context
  const contextSummary = useMemo(() => {
    if (!contextData) return '';

    const parts: string[] = [];
    const totalBlocks = contextData.pages.reduce((sum, p) => sum + p.blocks.length, 0);

    if (contextData.pages.length > 0) {
      parts.push(`${contextData.pages.length} page(s), ${totalBlocks} block(s)`);
    }
    if (contextData.blogs.length > 0) {
      parts.push(`${contextData.blogs.length} blog post(s)`);
    }

    return parts.length > 0 ? `Context: ${parts.join(', ')}` : '';
  }, [contextData]);

  return {
    contextData,
    contextSummary,
    isLoading,
    hasContext: !!contextData && (contextData.pages.length > 0 || contextData.blogs.length > 0),
  };
};

export default useAIChatContext;
