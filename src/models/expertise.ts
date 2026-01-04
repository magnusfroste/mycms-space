// ============================================
// Model Layer: Expertise Areas
// Business logic, React Query hooks, UI feedback
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import * as expertiseData from '@/data/expertise';
import type { ExpertiseArea } from '@/types';

// Re-export types
export type { ExpertiseArea };

// Query keys
export const expertiseKeys = {
  all: ['expertise-areas'] as const,
};

// Fetch all expertise areas
export const useExpertiseAreas = () => {
  return useQuery({
    queryKey: expertiseKeys.all,
    queryFn: expertiseData.fetchExpertiseAreas,
  });
};

// Create expertise area
export const useCreateExpertiseArea = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: expertiseData.createExpertiseArea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expertiseKeys.all });
      toast({
        title: 'Success',
        description: 'Expertise area created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create expertise area: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

// Update expertise area
export const useUpdateExpertiseArea = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, ...updates }: Partial<ExpertiseArea> & { id: string }) =>
      expertiseData.updateExpertiseArea(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expertiseKeys.all });
      toast({
        title: 'Success',
        description: 'Expertise area updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update expertise area: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

// Delete expertise area
export const useDeleteExpertiseArea = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: expertiseData.deleteExpertiseArea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expertiseKeys.all });
      toast({
        title: 'Success',
        description: 'Expertise area deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete expertise area: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

// Realtime subscription hook
export const useExpertiseAreasSubscription = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = expertiseData.subscribeToExpertiseAreas(() => {
      queryClient.invalidateQueries({ queryKey: expertiseKeys.all });
    });

    return unsubscribe;
  }, [queryClient]);
};
