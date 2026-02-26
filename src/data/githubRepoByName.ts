// ============================================
// Data Layer: Single GitHub Repo by Name
// ============================================

import { supabase } from '@/integrations/supabase/client';
import type { GitHubRepoWithImages } from '@/data/githubRepos';

export const fetchGitHubRepoByName = async (name: string): Promise<GitHubRepoWithImages | null> => {
  const { data: repo, error } = await supabase
    .from('github_repos')
    .select('*')
    .eq('name', name)
    .eq('enabled', true)
    .maybeSingle();

  if (error) throw error;
  if (!repo) return null;

  const { data: images, error: imgError } = await supabase
    .from('github_repo_images')
    .select('*')
    .eq('repo_id', repo.id)
    .order('order_index');

  if (imgError) throw imgError;

  return {
    ...repo,
    images: images || [],
  } as GitHubRepoWithImages;
};
