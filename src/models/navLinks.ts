// ============================================
// Model Layer: Nav Links
// Business logic, React Query hooks, UI feedback
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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

  return useMutation({
    mutationFn: navLinksData.createNavLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: navLinksKeys.enabled });
      queryClient.invalidateQueries({ queryKey: navLinksKeys.all });
      toast.success('Navigation link created');
    },
    onError: (error: any) => {
      toast.error('Error: ' + error.message);
    },
  });
};

// Update nav link
export const useUpdateNavLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...updates }: UpdateNavLinkInput) =>
      navLinksData.updateNavLink(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: navLinksKeys.enabled });
      queryClient.invalidateQueries({ queryKey: navLinksKeys.all });
    },
    onError: (error: any) => {
      toast.error('Error: ' + error.message);
    },
  });
};

// Delete nav link
export const useDeleteNavLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: navLinksData.deleteNavLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: navLinksKeys.enabled });
      queryClient.invalidateQueries({ queryKey: navLinksKeys.all });
      toast.success('Navigation link deleted');
    },
    onError: (error: any) => {
      toast.error('Error: ' + error.message);
    },
  });
};

// Reorder nav links
export const useReorderNavLinks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: navLinksData.reorderNavLinks,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: navLinksKeys.enabled });
      queryClient.invalidateQueries({ queryKey: navLinksKeys.all });
    },
    onError: (error: any) => {
      toast.error('Error: ' + error.message);
    },
  });
};
