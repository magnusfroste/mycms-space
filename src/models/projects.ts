// ============================================
// Model Layer: Projects
// Business logic, React Query hooks, UI feedback
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import * as projectsData from '@/data/projects';
import type { CreateProjectInput, UpdateProjectInput, Project } from '@/types';

// Re-export types
export type { Project, CreateProjectInput, UpdateProjectInput };
export type { ProjectImage } from '@/types';

// Query keys
export const projectKeys = {
  all: ['projects'] as const,
};

// Fetch all projects
export const useProjects = () => {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: projectsData.fetchProjects,
  });
};

// Create project
export const useCreateProject = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: projectsData.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      toast({
        title: 'Success',
        description: 'Project created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to create project: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

// Update project
export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: projectsData.updateProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      toast({
        title: 'Success',
        description: 'Project updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to update project: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

// Delete project
export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: projectsData.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      toast({
        title: 'Success',
        description: 'Project deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to delete project: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

// Delete project image
export const useDeleteProjectImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ imageId, imagePath }: { imageId: string; imagePath: string }) =>
      projectsData.deleteProjectImage(imageId, imagePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      toast({
        title: 'Success',
        description: 'Image deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to delete image: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

// Reorder project images
export const useReorderProjectImages = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ images }: { images: { id: string; order_index: number }[] }) =>
      projectsData.reorderProjectImages(images),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      toast({
        title: 'Success',
        description: 'Images reordered successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to reorder images: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

// Reorder projects (no toast - for drag & drop)
export const useReorderProjects = () => {
  return useMutation({
    mutationFn: ({ updates }: { updates: { id: string; order_index: number }[] }) =>
      projectsData.reorderProjects(updates),
  });
};

// Helper: Export storage functions for direct access
export { uploadProjectImage, deleteProjectImageFromStorage } from '@/data/projects';
