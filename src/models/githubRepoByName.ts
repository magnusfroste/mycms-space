// ============================================
// Model Layer: Single GitHub Repo by Name
// React Query hook
// ============================================

import { useQuery } from '@tanstack/react-query';
import { fetchGitHubRepoByName } from '@/data/githubRepoByName';

export const useGitHubRepoByName = (name: string | undefined) => {
  return useQuery({
    queryKey: ['github-repo', name],
    queryFn: () => fetchGitHubRepoByName(name!),
    enabled: !!name,
  });
};
