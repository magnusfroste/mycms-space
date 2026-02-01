// ============================================
// useAIChatContext Hook
// Fetches page and blog content for AI context
// ============================================

import { useMemo } from 'react';
import { useAIModule } from '@/models/modules';
import { usePages, usePageBlocks } from '@/models';
import { useBlogPosts } from '@/models/blog';

export interface AIContextData {
  pages: Array<{
    slug: string;
    title: string;
    content: string;
  }>;
  blogs: Array<{
    slug: string;
    title: string;
    excerpt?: string;
    content: string;
  }>;
}

/**
 * Hook to fetch and compile AI context from selected pages and blog posts
 */
export const useAIChatContext = () => {
  const { config: aiConfig, isLoading: aiLoading } = useAIModule();
  const { data: allPages = [], isLoading: pagesLoading } = usePages();
  const { data: allPosts = [], isLoading: postsLoading } = useBlogPosts();

  const isLoading = aiLoading || pagesLoading || postsLoading;

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
      // If no specific pages selected, include all enabled pages
      return allPages.filter((p) => p.enabled);
    }
    return allPages.filter((p) => selectedPageSlugs.includes(p.slug) && p.enabled);
  }, [includePageContext, selectedPageSlugs, allPages]);

  // Filter blog posts based on selection
  const selectedBlogs = useMemo(() => {
    if (!includeBlogContext) return [];
    const publishedPosts = allPosts.filter((p) => p.status === 'published');
    if (selectedBlogIds.length === 0) {
      // If no specific blogs selected, include all published
      return publishedPosts;
    }
    return publishedPosts.filter((p) => selectedBlogIds.includes(p.id));
  }, [includeBlogContext, selectedBlogIds, allPosts]);

  // Compile context data
  const contextData = useMemo((): AIContextData | null => {
    if (!includePageContext && !includeBlogContext) {
      return null;
    }

    return {
      pages: selectedPages.map((page) => ({
        slug: page.slug,
        title: page.title,
        content: page.description || '',
      })),
      blogs: selectedBlogs.map((post) => ({
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt || undefined,
        content: post.content,
      })),
    };
  }, [includePageContext, includeBlogContext, selectedPages, selectedBlogs]);

  // Create a summary string for quick context
  const contextSummary = useMemo(() => {
    if (!contextData) return '';

    const parts: string[] = [];

    if (contextData.pages.length > 0) {
      parts.push(`${contextData.pages.length} page(s)`);
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
