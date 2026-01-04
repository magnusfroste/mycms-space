// ============================================
// Model Layer: Nav Links
// Business logic, React Query hooks, UI feedback
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import * as navLinksData from '@/data/navLinks';
import type { NavLink, CreateNavLinkInput, UpdateNavLinkInput } from '@/types';

// Re-export types
export type { NavLink, CreateNavLinkInput, UpdateNavLinkInput };

// Query keys
export const navLinksKeys = {
  enabled: ['nav-links'] as const,
  all: ['nav-links-all'] as const,
};

// Fetch enabled nav links
export const useNavLinks = () => {
  return useQuery({
    queryKey: navLinksKeys.enabled,
    queryFn: navLinksData.fetchNavLinks,
  });
};

// Fetch all nav links (for admin)
export const useAllNavLinks = () => {
  return useQuery({
    queryKey: navLinksKeys.all,
    queryFn: navLinksData.fetchAllNavLinks,
  });
};

// Create nav link
export const useCreateNavLink = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: navLinksData.createNavLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: navLinksKeys.enabled });
      queryClient.invalidateQueries({ queryKey: navLinksKeys.all });
      toast({ title: 'Success', description: 'Navigation link created' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

// Update nav link
export const useUpdateNavLink = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, ...updates }: UpdateNavLinkInput) =>
      navLinksData.updateNavLink(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: navLinksKeys.enabled });
      queryClient.invalidateQueries({ queryKey: navLinksKeys.all });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

// Delete nav link
export const useDeleteNavLink = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: navLinksData.deleteNavLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: navLinksKeys.enabled });
      queryClient.invalidateQueries({ queryKey: navLinksKeys.all });
      toast({ title: 'Success', description: 'Navigation link deleted' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

// Reorder nav links
export const useReorderNavLinks = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: navLinksData.reorderNavLinks,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: navLinksKeys.enabled });
      queryClient.invalidateQueries({ queryKey: navLinksKeys.all });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};
