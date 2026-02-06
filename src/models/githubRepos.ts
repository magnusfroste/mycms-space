// ============================================
// Model Layer: GitHub Repos
// React Query hooks for synced GitHub repos
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as githubReposData from '@/data/githubRepos';
import type { 
  DbGitHubRepo, 
  DbGitHubRepoImage, 
  GitHubRepoWithImages 
} from '@/data/githubRepos';

// Re-export types
export type { DbGitHubRepo, DbGitHubRepoImage, GitHubRepoWithImages };

// Query keys
export const githubReposKeys = {
  all: ['github-repos'] as const,
  enabled: ['github-repos', 'enabled'] as const,
};

// Fetch all repos (for admin)
export const useGitHubRepos = () => {
  return useQuery({
    queryKey: githubReposKeys.all,
    queryFn: githubReposData.fetchAllGitHubRepos,
  });
};

// Fetch enabled repos (for public)
export const useEnabledGitHubRepos = () => {
  return useQuery({
    queryKey: githubReposKeys.enabled,
    queryFn: githubReposData.fetchEnabledGitHubRepos,
  });
};

// Sync repos from GitHub
export const useSyncGitHubRepos = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (username: string) => githubReposData.syncGitHubRepos(username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: githubReposKeys.all });
    },
  });
};

// Update repo enrichment
export const useUpdateGitHubRepo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Parameters<typeof githubReposData.updateGitHubRepo>[1];
    }) => githubReposData.updateGitHubRepo(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: githubReposKeys.all });
      queryClient.invalidateQueries({ queryKey: githubReposKeys.enabled });
    },
  });
};

// Update order with optimistic update
export const useUpdateGitHubRepoOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Array<{ id: string; order_index: number }>) => 
      githubReposData.updateGitHubRepoOrder(updates),
    onMutate: async (updates) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: githubReposKeys.all });

      // Snapshot previous value
      const previousRepos = queryClient.getQueryData<GitHubRepoWithImages[]>(githubReposKeys.all);

      // Optimistically update the cache
      if (previousRepos) {
        const updatedRepos = previousRepos.map(repo => {
          const update = updates.find(u => u.id === repo.id);
          return update ? { ...repo, order_index: update.order_index } : repo;
        });
        // Sort by new order
        updatedRepos.sort((a, b) => a.order_index - b.order_index);
        queryClient.setQueryData(githubReposKeys.all, updatedRepos);
      }

      return { previousRepos };
    },
    onError: (_err, _updates, context) => {
      // Rollback on error
      if (context?.previousRepos) {
        queryClient.setQueryData(githubReposKeys.all, context.previousRepos);
      }
    },
    onSettled: () => {
      // Refetch to ensure sync with server
      queryClient.invalidateQueries({ queryKey: githubReposKeys.all });
    },
  });
};

// Add image
export const useAddGitHubRepoImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      repoId, 
      imageUrl, 
      imagePath, 
      altText 
    }: { 
      repoId: string; 
      imageUrl: string; 
      imagePath: string | null; 
      altText?: string;
    }) => githubReposData.addGitHubRepoImage(repoId, imageUrl, imagePath, altText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: githubReposKeys.all });
    },
  });
};

// Delete image
export const useDeleteGitHubRepoImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageId: string) => githubReposData.deleteGitHubRepoImage(imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: githubReposKeys.all });
    },
  });
};

// Delete repo
export const useDeleteGitHubRepo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => githubReposData.deleteGitHubRepo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: githubReposKeys.all });
      queryClient.invalidateQueries({ queryKey: githubReposKeys.enabled });
    },
  });
};

// Sync to GitHub
export const useSyncToGitHub = () => {
  return useMutation({
    mutationFn: ({ 
      fullName, 
      options 
    }: { 
      fullName: string; 
      options: {
        description?: string;
        homepage?: string;
        topics?: string[];
      };
    }) => githubReposData.syncToGitHub(fullName, options),
  });
};
