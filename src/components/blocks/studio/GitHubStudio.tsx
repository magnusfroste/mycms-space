// ============================================
// GitHub / projects block - Studio variant
// 'list': dense rows (name · one-liner · language · date · arrow), used on
// the home page as "Selected work". Other layouts: hairline project cards.
// ============================================

import React, { useId, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import OptimizedImage from '@/components/common/OptimizedImage';
import { StudioSection, StudioSectionHeader } from '@/components/studio/StudioSection';
import { useEnabledGitHubRepos } from '@/models/githubRepos';
import { stripMarkdown } from '@/lib/utils/markdown';
import type { GitHubBlockConfig } from '@/types/github';
import type { GitHubRepoWithImages } from '@/data/githubRepos';

interface GitHubStudioProps {
  config: GitHubBlockConfig;
  headingLevel?: 'h1' | 'h2';
}

/** "FlowWink.com – Effortless modern CMS" → name + tagline; otherwise first sentence of the description */
export const splitRepoTitle = (repo: GitHubRepoWithImages) => {
  const fullTitle = (repo.enriched_title || repo.name).trim();
  const match = fullTitle.match(/^(.+?)(?:\s+[-–—|]\s+|:\s+)(.+)$/);
  if (match) return { name: match[1], tagline: match[2] };
  const description = stripMarkdown(repo.enriched_description || repo.description || '');
  const firstSentence = description.split(/(?<=[.!?])\s/)[0] || description;
  return { name: fullTitle, tagline: firstSentence };
};

/**
 * Hand-picked repos (selectedRepos) first in the given order, then featured
 * (in their order), then the rest by latest activity.
 */
export const orderRepos = (repos: GitHubRepoWithImages[], selected?: string[]) => {
  const picked = (selected || [])
    .map((name) => repos.find((r) => r.name === name))
    .filter((r): r is GitHubRepoWithImages => !!r);
  const pickedIds = new Set(picked.map((r) => r.id));
  const remaining = repos.filter((r) => !pickedIds.has(r.id));
  const featured = remaining.filter((r) => r.featured);
  const rest = remaining
    .filter((r) => !r.featured)
    .sort((a, b) => (b.pushed_at || '').localeCompare(a.pushed_at || ''));
  return [...picked, ...featured, ...rest];
};

// The date on a card is when the project started (GitHub creation date), not
// the last push: active repos are pushed weekly, so "last push" made every
// project look brand new. The last update is in the tooltip.
const repoDate = (repo: GitHubRepoWithImages) => {
  const raw = repo.created_at_github || repo.pushed_at;
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  const pushed = repo.pushed_at ? new Date(repo.pushed_at) : null;
  const title = `Started ${format(date, 'MMM yyyy')}${pushed && !Number.isNaN(pushed.getTime()) ? ` · updated ${format(pushed, 'd MMM yyyy')}` : ''}`;
  return { label: format(date, 'MMM yyyy'), iso: raw, title };
};

const LanguageTag: React.FC<{ name: string }> = ({ name }) => (
  <span className="rounded border border-border px-[7px] py-[2px] font-mono text-xs text-muted-foreground">{name}</span>
);

export const WorkList: React.FC<{ repos: GitHubRepoWithImages[]; showLanguages: boolean }> = ({ repos, showLanguages }) => (
  <ul className="border-t border-border">
    {repos.map((repo) => {
      const { name, tagline } = splitRepoTitle(repo);
      const date = repoDate(repo);
      return (
        <li key={repo.id} className="border-b border-border">
          <Link
            to={`/project/${repo.name}`}
            className="group flex flex-wrap items-center gap-x-5 gap-y-1.5 px-1 py-4 text-foreground transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none md:flex-nowrap md:py-5"
          >
            <span className="min-w-0 basis-full text-[16px] font-semibold leading-snug md:basis-[220px] md:shrink-0 md:text-[17px]">
              {name}
            </span>
            <span className="min-w-0 basis-full text-[15px] leading-[1.5] text-foreground/75 line-clamp-2 md:line-clamp-none md:flex-1 md:basis-0 md:truncate">
              {tagline}
            </span>
            <span className="flex shrink-0 items-center gap-4 md:gap-5">
              {showLanguages && repo.language && <LanguageTag name={repo.language} />}
              {date && (
                <time dateTime={date.iso} title={date.title} className="font-mono text-[12.5px] text-muted-foreground md:w-[72px] md:text-right">
                  {date.label}
                </time>
              )}
              <span
                aria-hidden="true"
                className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
              >
                →
              </span>
            </span>
          </Link>
        </li>
      );
    })}
  </ul>
);

const WorkCards: React.FC<{ repos: GitHubRepoWithImages[]; showLanguages: boolean; showImages: boolean; showTopics: boolean }> = ({
  repos,
  showLanguages,
  showImages,
  showTopics,
}) => (
  <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {repos.map((repo) => {
      const { name, tagline } = splitRepoTitle(repo);
      const date = repoDate(repo);
      const image = showImages ? repo.images?.[0]?.image_url : undefined;
      return (
        <li key={repo.id} className="min-w-0">
          <Link
            to={`/project/${repo.name}`}
            className="group flex h-full flex-col overflow-hidden rounded-[14px] border border-border bg-card transition-colors hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {showImages && (
              <div className="flex aspect-[16/9] items-center justify-center overflow-hidden border-b border-border bg-muted/60">
                {image ? (
                  <OptimizedImage
                    src={image}
                    alt=""
                    className="h-full w-full object-cover object-top"
                    displayWidth={640}
                    sizes="(min-width: 1024px) 352px, (min-width: 640px) 50vw, 100vw"
                    width={640}
                    height={360}
                  />
                ) : (
                  // Keeps the grid rhythm for projects without a screenshot
                  <span aria-hidden="true" className="font-mono text-sm text-muted-foreground">
                    {repo.name}
                  </span>
                )}
              </div>
            )}
            <div className="flex flex-1 flex-col gap-2 p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="min-w-0 text-[16px] font-semibold leading-snug text-foreground">{name}</h3>
                {date && (
                  <time dateTime={date.iso} title={date.title} className="shrink-0 font-mono text-[12px] text-muted-foreground">
                    {date.label}
                  </time>
                )}
              </div>
              <p className="line-clamp-2 text-[14px] leading-[1.55] text-foreground/75">{tagline}</p>
              {(showLanguages && repo.language) || (showTopics && repo.topics?.length) ? (
                <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                  {showLanguages && repo.language && <LanguageTag name={repo.language} />}
                  {showTopics &&
                    repo.topics?.slice(0, 2).map((topic) => <LanguageTag key={topic} name={topic} />)}
                </div>
              ) : null}
            </div>
          </Link>
        </li>
      );
    })}
  </ul>
);

const GitHubStudio: React.FC<GitHubStudioProps> = ({ config, headingLevel = 'h2' }) => {
  const { pathname } = useLocation();
  const headingId = useId();
  const { data: repos = [], isLoading, error } = useEnabledGitHubRepos();

  const layout = config.layout || 'grid';
  const isList = layout === 'list' || layout === 'minimal-list' || layout === 'compact';
  const pageSize = config.maxRepos || 6;
  const showLanguages = config.showLanguages ?? true;
  const showTopics = config.showTopics ?? false;
  const showImages = config.showImages ?? true;
  const allProjectsUrl = config.allProjectsUrl || '/github';

  const ordered = useMemo(() => orderRepos(repos, config.selectedRepos), [repos, config.selectedRepos]);

  const [visible, setVisible] = useState(pageSize);
  const shown = ordered.slice(0, visible);
  // A list is a fixed selection; the cards page can grow
  const canShowMore = !isList && visible < ordered.length;

  const onProjectsPage = pathname === allProjectsUrl;
  const showAllLink = (config.showAllProjectsLink ?? true) && !onProjectsPage && ordered.length > shown.length;
  const allText = config.allProjectsText || `All ${ordered.length} projects`;

  const title = config.title ?? 'Selected work';

  return (
    <StudioSection labelledBy={title ? headingId : undefined} bordered={headingLevel !== 'h1'}>
      <div className="flex flex-col gap-6">
        <StudioSectionHeader
          as={headingLevel}
          id={headingId}
          title={title}
          subtitle={config.subtitle}
          action={showAllLink ? { label: allText, href: allProjectsUrl } : undefined}
        />

        {error ? (
          <p className="text-sm text-muted-foreground">Could not load projects right now.</p>
        ) : isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: Math.min(pageSize, 6) }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : ordered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No projects published yet.</p>
        ) : isList ? (
          <WorkList repos={shown} showLanguages={showLanguages} />
        ) : (
          <WorkCards repos={shown} showLanguages={showLanguages} showImages={showImages} showTopics={showTopics} />
        )}

        {canShowMore && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => setVisible((v) => Math.min(v + pageSize, ordered.length))}
              className="inline-flex h-10 items-center rounded-full border border-foreground/15 px-5 text-sm font-medium text-foreground transition-colors hover:border-foreground/30 hover:bg-muted/60"
            >
              Show more <span className="ml-2 font-mono text-xs text-muted-foreground">{ordered.length - visible}</span>
            </button>
          </div>
        )}
      </div>
    </StudioSection>
  );
};

export default GitHubStudio;
