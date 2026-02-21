// ============================================
// Model Layer: Pages
// Business logic, React Query hooks, UI feedback
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import * as pagesData from '@/data/pages';
import type { Page, CreatePageInput, UpdatePageInput } from '@/types/pages';

// Re-export types
export type { Page, CreatePageInput, UpdatePageInput };

// Query keys
export const pagesKeys = {
  all: ['pages'] as const,
  enabled: ['pages', 'enabled'] as const,
  bySlug: (slug: string) => ['pages', slug] as const,
  mainLanding: ['pages', 'main-landing'] as const,
};

// Fetch all pages (for admin)
export const usePages = () => {
  return useQuery({
    queryKey: pagesKeys.all,
    queryFn: pagesData.fetchPages,
  });
};

// Fetch enabled pages
export const useEnabledPages = () => {
  return useQuery({
    queryKey: pagesKeys.enabled,
    queryFn: pagesData.fetchEnabledPages,
  });
};

// Fetch page by slug
export const usePageBySlug = (slug: string) => {
  return useQuery({
    queryKey: pagesKeys.bySlug(slug),
    queryFn: () => pagesData.fetchPageBySlug(slug),
    enabled: !!slug,
  });
};

// Fetch main landing page
export const useMainLandingPage = () => {
  return useQuery({
    queryKey: pagesKeys.mainLanding,
    queryFn: pagesData.fetchMainLandingPage,
  });
};

// Create page
export const useCreatePage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pagesData.createPage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pagesKeys.all });
      queryClient.invalidateQueries({ queryKey: pagesKeys.enabled });
      queryClient.invalidateQueries({ queryKey: pagesKeys.mainLanding });
      toast.success('Page created');
    },
    onError: (error: Error) => {
      toast.error('Error: ' + error.message);
    },
  });
};

// Update page
export const useUpdatePage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pagesData.updatePage,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: pagesKeys.all });
      queryClient.invalidateQueries({ queryKey: pagesKeys.enabled });
      queryClient.invalidateQueries({ queryKey: pagesKeys.mainLanding });
      queryClient.invalidateQueries({ queryKey: pagesKeys.bySlug(data.slug) });
    },
    onError: (error: Error) => {
      toast.error('Error: ' + error.message);
    },
  });
};

// Delete page
export const useDeletePage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pagesData.deletePage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pagesKeys.all });
      queryClient.invalidateQueries({ queryKey: pagesKeys.enabled });
      queryClient.invalidateQueries({ queryKey: pagesKeys.mainLanding });
      toast.success('Page deleted');
    },
    onError: (error: Error) => {
      toast.error('Error: ' + error.message);
    },
  });
};

// Realtime subscription
export const usePagesSubscription = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = pagesData.subscribeToPages(() => {
      queryClient.invalidateQueries({ queryKey: pagesKeys.all });
      queryClient.invalidateQueries({ queryKey: pagesKeys.enabled });
      queryClient.invalidateQueries({ queryKey: pagesKeys.mainLanding });
    });

    return unsubscribe;
  }, [queryClient]);
};
