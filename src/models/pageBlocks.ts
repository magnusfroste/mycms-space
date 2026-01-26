// ============================================
// Model Layer: Page Blocks
// Business logic, React Query hooks
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import * as pageBlocksData from '@/data/pageBlocks';
import type { PageBlock, CreatePageBlockInput, UpdatePageBlockInput } from '@/types';

// Re-export types
export type { PageBlock, CreatePageBlockInput, UpdatePageBlockInput };

// Query keys
export const pageBlocksKeys = {
  all: ['page-blocks'] as const,
  byPage: (pageSlug: string) => ['page-blocks', pageSlug] as const,
};

// Fetch blocks for a specific page
export const usePageBlocks = (pageSlug: string) => {
  return useQuery({
    queryKey: pageBlocksKeys.byPage(pageSlug),
    queryFn: () => pageBlocksData.fetchPageBlocks(pageSlug),
    enabled: !!pageSlug,
  });
};

// Fetch all blocks (for admin)
export const useAllPageBlocks = () => {
  return useQuery({
    queryKey: pageBlocksKeys.all,
    queryFn: pageBlocksData.fetchAllPageBlocks,
  });
};

// Create a new block
export const useCreatePageBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pageBlocksData.createPageBlock,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: pageBlocksKeys.byPage(data.page_slug) });
      queryClient.invalidateQueries({ queryKey: pageBlocksKeys.all });
    },
  });
};

// Update an existing block
export const useUpdatePageBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pageBlocksData.updatePageBlock,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: pageBlocksKeys.byPage(data.page_slug) });
      queryClient.invalidateQueries({ queryKey: pageBlocksKeys.all });
    },
  });
};

// Delete a block
export const useDeletePageBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pageBlocksData.deletePageBlock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pageBlocksKeys.all });
    },
  });
};

// Reorder blocks
export const useReorderPageBlocks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pageBlocksData.reorderPageBlocks,
    onSuccess: () => {
      // Invalidate all page block queries
      queryClient.invalidateQueries({ queryKey: pageBlocksKeys.all });
      queryClient.invalidateQueries({ queryKey: ['page-blocks', 'home'] });
    },
  });
};

// Realtime subscription hook
export const usePageBlocksSubscription = (pageSlug: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!pageSlug) return;

    const unsubscribe = pageBlocksData.subscribeToPageBlocks(pageSlug, () => {
      queryClient.invalidateQueries({ queryKey: pageBlocksKeys.byPage(pageSlug) });
    });

    return unsubscribe;
  }, [pageSlug, queryClient]);
};
