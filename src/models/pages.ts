// ============================================
// Model Layer: Pages
// Business logic, React Query hooks, UI feedback
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();

  return useMutation({
    mutationFn: pagesData.createPage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pagesKeys.all });
      queryClient.invalidateQueries({ queryKey: pagesKeys.enabled });
      queryClient.invalidateQueries({ queryKey: pagesKeys.mainLanding });
      toast({ title: 'Sida skapad', description: 'Den nya sidan har skapats' });
    },
    onError: (error: Error) => {
      toast({ title: 'Fel', description: error.message, variant: 'destructive' });
    },
  });
};

// Update page
export const useUpdatePage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: pagesData.updatePage,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: pagesKeys.all });
      queryClient.invalidateQueries({ queryKey: pagesKeys.enabled });
      queryClient.invalidateQueries({ queryKey: pagesKeys.mainLanding });
      queryClient.invalidateQueries({ queryKey: pagesKeys.bySlug(data.slug) });
    },
    onError: (error: Error) => {
      toast({ title: 'Fel', description: error.message, variant: 'destructive' });
    },
  });
};

// Delete page
export const useDeletePage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: pagesData.deletePage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pagesKeys.all });
      queryClient.invalidateQueries({ queryKey: pagesKeys.enabled });
      queryClient.invalidateQueries({ queryKey: pagesKeys.mainLanding });
      toast({ title: 'Sida borttagen', description: 'Sidan och alla dess block har tagits bort' });
    },
    onError: (error: Error) => {
      toast({ title: 'Fel', description: error.message, variant: 'destructive' });
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
