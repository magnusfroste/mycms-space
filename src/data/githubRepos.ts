// ============================================
// Data Layer: GitHub Repos
// Pure Supabase API calls for synced repos
// ============================================

import { supabase } from '@/integrations/supabase/client';
import type { GitHubRepo, GitHubApiResponse } from '@/types/github';

// Types matching database schema
export interface DbGitHubRepo {
  id: string;
  github_id: string;
  name: string;
  full_name: string;
  description: string | null;
  url: string;
  homepage: string | null;
  language: string | null;
  stars: number;
  forks: number;
  topics: string[];
  pushed_at: string | null;
  created_at_github: string | null;
  is_fork: boolean;
  is_archived: boolean;
  // Enrichment
  enriched_title: string | null;
  enriched_description: string | null;
  problem_statement: string | null;
  why_it_matters: string | null;
  readme_content: string | null;
  // Status
  enabled: boolean;
  featured: boolean;
  order_index: number;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface DbGitHubRepoImage {
  id: string;
  repo_id: string;
  image_url: string;
  image_path: string | null;
  alt_text: string | null;
  order_index: number;
  created_at: string;
}

export interface GitHubRepoWithImages extends DbGitHubRepo {
  images: DbGitHubRepoImage[];
}

// Fetch all repos (for admin)
export const fetchAllGitHubRepos = async (): Promise<GitHubRepoWithImages[]> => {
  const { data: repos, error } = await supabase
    .from('github_repos')
    .select('*')
    .order('order_index');

  if (error) throw error;

  // Fetch images for all repos
  const repoIds = (repos || []).map((r: DbGitHubRepo) => r.id);
  const { data: images, error: imgError } = await supabase
    .from('github_repo_images')
    .select('*')
    .in('repo_id', repoIds)
    .order('order_index');

  if (imgError) throw imgError;

  // Map images to repos
  return (repos || []).map((repo: DbGitHubRepo) => ({
    ...repo,
    images: (images || []).filter((img: DbGitHubRepoImage) => img.repo_id === repo.id),
  }));
};

// Fetch enabled repos (for public display)
export const fetchEnabledGitHubRepos = async (): Promise<GitHubRepoWithImages[]> => {
  const { data: repos, error } = await supabase
    .from('github_repos')
    .select('*')
    .eq('enabled', true)
    .order('featured', { ascending: false })
    .order('order_index');

  if (error) throw error;

  const repoIds = (repos || []).map((r: DbGitHubRepo) => r.id);
  if (repoIds.length === 0) return [];

  const { data: images, error: imgError } = await supabase
    .from('github_repo_images')
    .select('*')
    .in('repo_id', repoIds)
    .order('order_index');

  if (imgError) throw imgError;

  return (repos || []).map((repo: DbGitHubRepo) => ({
    ...repo,
    images: (images || []).filter((img: DbGitHubRepoImage) => img.repo_id === repo.id),
  }));
};

// Sync repos from GitHub into github_repos (done server-side by the github-repos
// function, the same path the nightly Autopilot job uses).
export const syncGitHubRepos = async (
  username: string,
): Promise<{ synced: number; new: number; failed?: number; warning?: string }> => {
  const { data, error } = await supabase.functions.invoke('github-repos', {
    body: { action: 'sync', username },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
};

// Update repo enrichment
export const updateGitHubRepo = async (
  id: string,
  updates: Partial<Pick<DbGitHubRepo, 
    'enriched_title' | 'enriched_description' | 'problem_statement' | 
    'why_it_matters' | 'enabled' | 'featured' | 'order_index' | 'homepage' | 'topics'
  >>
): Promise<DbGitHubRepo> => {
  const { data, error } = await supabase
    .from('github_repos')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as DbGitHubRepo;
};

// Update order indices
export const updateGitHubRepoOrder = async (
  updates: Array<{ id: string; order_index: number }>
): Promise<void> => {
  for (const { id, order_index } of updates) {
    const { error } = await supabase
      .from('github_repos')
      .update({ order_index })
      .eq('id', id);

    if (error) throw error;
  }
};

// Add image to repo
export const addGitHubRepoImage = async (
  repoId: string,
  imageUrl: string,
  imagePath: string | null,
  altText?: string
): Promise<DbGitHubRepoImage> => {
  // Get max order
  const { data: existing } = await supabase
    .from('github_repo_images')
    .select('order_index')
    .eq('repo_id', repoId)
    .order('order_index', { ascending: false })
    .limit(1);

  const maxOrder = existing?.[0]?.order_index ?? -1;

  const { data, error } = await supabase
    .from('github_repo_images')
    .insert({
      repo_id: repoId,
      image_url: imageUrl,
      image_path: imagePath,
      alt_text: altText,
      order_index: maxOrder + 1,
    })
    .select()
    .single();

  if (error) throw error;
  return data as DbGitHubRepoImage;
};

// Delete image
export const deleteGitHubRepoImage = async (imageId: string): Promise<void> => {
  const { error } = await supabase
    .from('github_repo_images')
    .delete()
    .eq('id', imageId);

  if (error) throw error;
};

// Delete repo (cascade deletes images)
export const deleteGitHubRepo = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('github_repos')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Sync data back to GitHub
export const syncToGitHub = async (
  fullName: string,
  options: {
    description?: string;
    homepage?: string;
    topics?: string[];
  }
): Promise<{ success: boolean; updated?: Record<string, boolean>; error?: string }> => {
  const [owner, repo] = fullName.split('/');
  
  if (!owner || !repo) {
    return { success: false, error: 'Invalid repository name' };
  }

  const { data, error } = await supabase.functions.invoke('github-repos', {
    body: { 
      action: 'update',
      owner,
      repo,
      ...options,
    },
  });

  if (error) {
    console.error('Sync to GitHub error:', error);
    return { success: false, error: error.message };
  }

  if (data?.error) {
    return { success: false, error: data.error };
  }

  return { success: true, updated: data?.updated };
};

// Enrich repo with AI-generated content
export const enrichWithAI = async (
  repoData: {
    name: string;
    description: string | null;
    language: string | null;
    topics: string[];
    stars: number;
    readme: string | null;
    homepage: string | null;
  }
): Promise<{
  success: boolean;
  title?: string;
  description?: string;
  problemStatement?: string;
  whyItMatters?: string;
  hadHomepage?: boolean;
  error?: string;
}> => {
  const { data, error } = await supabase.functions.invoke('enrich-github-repo', {
    body: repoData,
  });

  if (error) {
    console.error('Enrich error:', error);
    return { success: false, error: error.message };
  }

  if (data?.error) {
    return { success: false, error: data.error };
  }

  return {
    success: true,
    title: data?.title,
    description: data?.description,
    problemStatement: data?.problemStatement,
    whyItMatters: data?.whyItMatters,
    hadHomepage: data?.hadHomepage,
  };
};

// Generate topic suggestions using AI
export const suggestTopics = async (
  fullName: string,
  enrichedData: {
    enrichedDescription?: string;
    problemStatement?: string;
    whyItMatters?: string;
  }
): Promise<{ success: boolean; topics?: string[]; hadReadme?: boolean; error?: string }> => {
  const [owner, repo] = fullName.split('/');
  
  if (!owner || !repo) {
    return { success: false, error: 'Invalid repository name' };
  }

  const { data, error } = await supabase.functions.invoke('github-repos', {
    body: { 
      action: 'suggest-topics',
      owner,
      repo,
      enrichedDescription: enrichedData.enrichedDescription,
      problemStatement: enrichedData.problemStatement,
      whyItMatters: enrichedData.whyItMatters,
    },
  });

  if (error) {
    console.error('Suggest topics error:', error);
    return { success: false, error: error.message };
  }

  if (data?.error) {
    return { success: false, error: data.error };
  }

  return { 
    success: true, 
    topics: data?.topics,
    hadReadme: data?.hadReadme,
  };
};
