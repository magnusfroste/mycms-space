// ============================================
// Model Layer: Featured Items
// Business logic, React Query hooks, UI feedback
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import * as featuredData from '@/data/featured';
import type { FeaturedItem } from '@/types';

// Re-export types
export type { FeaturedItem };

// Query keys
export const featuredKeys = {
  all: ['featured-items'] as const,
};

// Fetch all featured items
export const useFeaturedItems = () => {
  return useQuery({
    queryKey: featuredKeys.all,
    queryFn: featuredData.fetchFeaturedItems,
  });
};

// Create featured item
export const useCreateFeaturedItem = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: featuredData.createFeaturedItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: featuredKeys.all });
      toast({
        title: 'Success',
        description: 'Featured item created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create featured item: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

// Update featured item
export const useUpdateFeaturedItem = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: featuredData.updateFeaturedItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: featuredKeys.all });
      toast({
        title: 'Success',
        description: 'Featured item updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update featured item: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

// Delete featured item
export const useDeleteFeaturedItem = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, imagePath }: { id: string; imagePath: string | null }) =>
      featuredData.deleteFeaturedItem(id, imagePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: featuredKeys.all });
      toast({
        title: 'Success',
        description: 'Featured item deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete featured item: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

// Reorder featured item
export const useReorderFeaturedItem = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newOrderIndex }: { id: string; newOrderIndex: number }) =>
      featuredData.reorderFeaturedItem(id, newOrderIndex),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: featuredKeys.all });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to reorder: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};
