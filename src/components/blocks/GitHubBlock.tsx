// ============================================
// GitHub Block
// Displays GitHub profile and repositories
// Uses module config as fallback for username
// ============================================

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Star, 
  GitFork, 
  ExternalLink, 
  Github, 
  MapPin, 
  Building, 
  Users, 
  BookOpen 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useGitHubModule } from '@/models/modules';
import type { GitHubBlockConfig, GitHubApiResponse, GitHubRepo } from '@/types/github';

// Language colors (common ones)
const languageColors: Record<string, string> = {
  TypeScript: 'bg-blue-500',
  JavaScript: 'bg-yellow-400',
  Python: 'bg-green-500',
  Rust: 'bg-orange-500',
  Go: 'bg-cyan-500',
  Java: 'bg-red-500',
  'C++': 'bg-pink-500',
  C: 'bg-gray-500',
  Ruby: 'bg-red-600',
  PHP: 'bg-purple-500',
  Swift: 'bg-orange-400',
  Kotlin: 'bg-purple-400',
  Dart: 'bg-blue-400',
  HTML: 'bg-orange-600',
  CSS: 'bg-blue-600',
  Shell: 'bg-green-600',
  Vue: 'bg-emerald-500',
};

interface GitHubBlockProps {
  config: Record<string, unknown>;
}

const GitHubBlock: React.FC<GitHubBlockProps> = ({ config: rawConfig }) => {
  const blockConfig = rawConfig as unknown as GitHubBlockConfig;
  const { config: moduleConfig, isEnabled } = useGitHubModule();
  
  // Use block-level username, fallback to module username
  const username = blockConfig.username || moduleConfig?.username || '';
  
  const {
    title = 'Open Source Projects',
    subtitle = '',
    showProfile = true,
    showStats = moduleConfig?.show_stars ?? true,
    showLanguages = moduleConfig?.show_languages ?? true,
    showTopics = moduleConfig?.show_topics ?? true,
    maxRepos = moduleConfig?.default_max_repos || 6,
    layout = moduleConfig?.default_layout || 'grid',
    sortBy = moduleConfig?.default_sort_by || 'pushed',
  } = blockConfig;
  
  // Get forks visibility from module config
  const showForks = moduleConfig?.show_forks ?? true;

  const { data, isLoading, error } = useQuery<GitHubApiResponse>({
    queryKey: ['github-repos', username, maxRepos, sortBy],
    queryFn: async () => {
      if (!username) throw new Error('No GitHub username configured');
      
      const { data, error } = await supabase.functions.invoke('github-repos', {
        body: {
          username,
          includeProfile: showProfile,
          limit: maxRepos,
          sort: sortBy,
        },
      });

      if (error) throw error;
      return data as GitHubApiResponse;
    },
    enabled: !!username,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  if (!username) {
    return (
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <Github className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Configure a GitHub username to display repositories.</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>Failed to load GitHub data. Please try again later.</p>
        </div>
      </section>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const RepoCard = ({ repo }: { repo: GitHubRepo }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
            <a 
              href={repo.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 flex-shrink-0" />
              {repo.name}
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </CardTitle>
          {(showStats || showForks) && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {showStats && (
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  {repo.stars}
                </span>
              )}
              {showForks && (
                <span className="flex items-center gap-1">
                  <GitFork className="w-4 h-4" />
                  {repo.forks}
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {repo.description && (
          <p className="text-muted-foreground text-sm line-clamp-2">
            {repo.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {showLanguages && repo.language && (
            <Badge variant="secondary" className="flex items-center gap-1.5">
              <span 
                className={`w-2 h-2 rounded-full ${languageColors[repo.language] || 'bg-gray-400'}`} 
              />
              {repo.language}
            </Badge>
          )}
          {showTopics && repo.topics.slice(0, 3).map((topic) => (
            <Badge key={topic} variant="outline" className="text-xs">
              {topic}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Updated {formatDate(repo.pushedAt)}
        </p>
      </CardContent>
    </Card>
  );

  const CompactRepoItem = ({ repo }: { repo: GitHubRepo }) => (
    <a
      href={repo.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between py-3 px-4 hover:bg-muted/50 rounded-lg transition-colors group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <div className="min-w-0">
          <span className="font-medium group-hover:text-primary transition-colors">
            {repo.name}
          </span>
          {repo.description && (
            <p className="text-sm text-muted-foreground truncate">
              {repo.description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-shrink-0 ml-4">
        {repo.language && (
          <span className="flex items-center gap-1.5">
            <span 
              className={`w-2 h-2 rounded-full ${languageColors[repo.language] || 'bg-gray-400'}`} 
            />
            {repo.language}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5" />
          {repo.stars}
        </span>
        <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </a>
  );

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          {title && (
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          )}
          {subtitle && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Profile Card */}
        {showProfile && data?.profile && (
          <Card className="mb-12 max-w-2xl mx-auto">
            <CardContent className="flex flex-col sm:flex-row items-center gap-6 p-6">
              <img
                src={data.profile.avatarUrl}
                alt={data.profile.name || data.profile.username}
                className="w-20 h-20 rounded-full ring-2 ring-primary/20"
              />
              <div className="text-center sm:text-left flex-1">
                <a 
                  href={data.profile.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xl font-semibold hover:text-primary transition-colors"
                >
                  <Github className="w-5 h-5" />
                  {data.profile.name || data.profile.username}
                  <ExternalLink className="w-4 h-4" />
                </a>
                {data.profile.bio && (
                  <p className="text-muted-foreground mt-1">{data.profile.bio}</p>
                )}
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-3 text-sm text-muted-foreground">
                  {data.profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {data.profile.location}
                    </span>
                  )}
                  {data.profile.company && (
                    <span className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      {data.profile.company}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {data.profile.followers} followers
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {data.profile.publicRepos} repos
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className={`grid gap-6 ${layout === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : ''}`}>
            {Array.from({ length: maxRepos }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Repos */}
        {data?.repos && (
          <>
            {layout === 'grid' && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {data.repos.map((repo) => (
                  <RepoCard key={repo.id} repo={repo} />
                ))}
              </div>
            )}

            {layout === 'list' && (
              <div className="space-y-4 max-w-3xl mx-auto">
                {data.repos.map((repo) => (
                  <RepoCard key={repo.id} repo={repo} />
                ))}
              </div>
            )}

            {layout === 'compact' && (
              <Card className="max-w-3xl mx-auto">
                <CardContent className="p-2 divide-y">
                  {data.repos.map((repo) => (
                    <CompactRepoItem key={repo.id} repo={repo} />
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* View All Link */}
        {data?.profile && (
          <div className="text-center mt-8">
            <a
              href={data.profile.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              View all repositories on GitHub
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
};

export default GitHubBlock;
