// ============================================
// Related Projects Component
// Shows 2-3 other enabled projects at bottom of case study
// ============================================

import React from 'react';
import { Link } from 'react-router-dom';
import { Star, GitFork } from 'lucide-react';
import TechBadge from '@/components/common/TechBadge';
import { useEnabledGitHubRepos } from '@/models/githubRepos';

interface RelatedProjectsProps {
  currentRepoName: string;
}

const RelatedProjects: React.FC<RelatedProjectsProps> = ({ currentRepoName }) => {
  const { data: repos } = useEnabledGitHubRepos();

  const related = React.useMemo(() => {
    if (!repos) return [];
    return repos
      .filter((r) => r.name !== currentRepoName)
      .slice(0, 3);
  }, [repos, currentRepoName]);

  if (related.length === 0) return null;

  return (
    <section className="mt-16 pt-10 border-t border-border">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6">
        More Projects
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((repo) => {
          const title = repo.enriched_title || repo.name;
          const thumb = repo.images?.[0]?.image_url;

          return (
            <Link
              key={repo.id}
              to={`/project/${repo.name}`}
              className="group rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-lg"
            >
              {thumb && (
                <div className="aspect-video bg-muted overflow-hidden">
                  <img
                    src={thumb}
                    alt={title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {title}
                </h3>
                {repo.enriched_description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {repo.enriched_description}
                  </p>
                )}
                <div className="flex items-center gap-3 pt-1">
                  {repo.language && <TechBadge name={repo.language} />}
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="w-3 h-3" /> {repo.stars}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <GitFork className="w-3 h-3" /> {repo.forks}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default RelatedProjects;
