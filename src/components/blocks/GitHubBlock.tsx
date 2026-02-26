// ============================================
// GitHub Block
// Displays GitHub repositories with multiple layout options
// Uses local database for enabled repos with enrichment
// ============================================

import React, { useMemo, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
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
import { useGitHubModule } from '@/models/modules';
import { useEnabledGitHubRepos } from '@/models/githubRepos';
import type { GitHubBlockConfig } from '@/types/github';
import {
  ProjectCardsLayout,
  ClassicGridLayout,
  ShowcaseHeroLayout,
  MinimalListLayout,
} from './GitHubBlockLayouts';

interface GitHubBlockProps {
  config: Record<string, unknown>;
}

const GitHubBlock: React.FC<GitHubBlockProps> = ({ config: rawConfig }) => {
  const blockConfig = rawConfig as unknown as GitHubBlockConfig;
  const { config: moduleConfig } = useGitHubModule();
  const { data: repos = [], isLoading, error } = useEnabledGitHubRepos();
  
  const {
    title = 'Open Source Projects',
    subtitle = '',
    showStats = moduleConfig?.show_stars ?? true,
    showLanguages = moduleConfig?.show_languages ?? true,
    showTopics = moduleConfig?.show_topics ?? true,
    maxRepos = moduleConfig?.default_max_repos || 6,
    layout = moduleConfig?.default_layout || 'grid',
    showImages = true,
    showProblemStatement = true,
    showWhyItMatters = true,
  } = blockConfig;
  
  // Get forks visibility from module config
  const showForks = moduleConfig?.show_forks ?? true;

  // Shuffle repos once on mount for variety, then paginate
  const shuffledRepos = useMemo(() => {
    if (repos.length <= maxRepos) return repos;
    return [...repos].sort(() => Math.random() - 0.5);
  }, [repos, maxRepos]);

  const [visibleCount, setVisibleCount] = useState(maxRepos);
  const scrollTargetRef = useRef<HTMLDivElement>(null);
  const prevVisibleRef = useRef(maxRepos);
  const displayRepos = shuffledRepos.slice(0, visibleCount);
  const hasMore = visibleCount < shuffledRepos.length;

  const handleShowMore = useCallback(() => {
    prevVisibleRef.current = visibleCount;
    setVisibleCount(prev => {
      const next = Math.min(prev + maxRepos, shuffledRepos.length);
      setTimeout(() => {
        scrollTargetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
      return next;
    });
  }, [maxRepos, shuffledRepos.length, visibleCount]);

  if (error) {
    return (
      <section className="section-container">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>Failed to load GitHub data. Please try again later.</p>
        </div>
      </section>
    );
  }

  if (!isLoading && repos.length === 0) {
    return (
      <section className="section-container">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <Github className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No repositories enabled. Enable repos in the admin panel.</p>
        </div>
      </section>
    );
  }

  const layoutProps = {
    repos: displayRepos,
    showStats,
    showLanguages,
    showTopics,
    showImages,
    showProblemStatement,
    showWhyItMatters,
    showForks,
    animateFromIndex: prevVisibleRef.current,
  };

  const renderLayout = () => {
    switch (layout) {
      case 'project-cards':
        return <ProjectCardsLayout {...layoutProps} />;
      case 'showcase-hero':
        return <ShowcaseHeroLayout {...layoutProps} />;
      case 'minimal-list':
        return <MinimalListLayout {...layoutProps} />;
      case 'grid':
      case 'list':
      case 'compact':
      default:
        return <ClassicGridLayout {...layoutProps} />;
    }
  };

  return (
    <section className="section-container">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block text-sm font-medium text-primary uppercase tracking-widest mb-4 animate-fade-in">
            Open Source
          </span>
          {title && (
            <h2 className="section-title animate-fade-in" style={{ animationDelay: '0.1s' }}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="section-subtitle mt-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
        ) : (
          renderLayout()
        )}

        {/* Scroll target for new repos */}
        <div ref={scrollTargetRef} />

        {/* Show More */}
        {!isLoading && hasMore && (
          <div className="text-center mt-10">
            <Button
              variant="outline"
              className="rounded-full px-8"
              onClick={handleShowMore}
            >
              Show more projects
            </Button>
          </div>
        )}

        {/* View All Link */}
        {moduleConfig?.username && (
          <div className="text-center mt-8">
            <a
              href={`https://github.com/${moduleConfig.username}`}
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
