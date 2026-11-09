// ============================================
// Project case study - Studio view
// Title, one-liner and links up top; story (problem, why it matters,
// README) in a readable column with a quiet side rail (stack, links,
// contact); related projects as dense rows.
// ============================================

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import MarkdownContent from '@/components/common/MarkdownContent';
import OptimizedImage from '@/components/common/OptimizedImage';
import { StudioContainer, studioH2 } from '@/components/studio/StudioSection';
import { WorkList, splitRepoTitle } from '@/components/blocks/studio/GitHubStudio';
import { useEnabledGitHubRepos } from '@/models/githubRepos';
import { stripMarkdown } from '@/lib/utils/markdown';
import type { GitHubRepoWithImages } from '@/data/githubRepos';

const pill =
  'inline-flex h-11 items-center rounded-full px-5 text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="mb-3 text-[20px] font-semibold tracking-[-0.015em] text-foreground">{children}</h2>
);

const ProjectCaseStudyStudio: React.FC<{ repo: GitHubRepoWithImages }> = ({ repo }) => {
  const { data: repos = [] } = useEnabledGitHubRepos();
  const { name, tagline } = splitRepoTitle(repo);
  const description = stripMarkdown(repo.enriched_description || repo.description || '');
  const mainImage = repo.images?.[0]?.image_url;
  const gallery = repo.images?.slice(1) || [];
  const topics = repo.topics || [];
  const updated = repo.pushed_at ? format(new Date(repo.pushed_at), 'MMM yyyy') : null;

  const related = useMemo(
    () => repos.filter((r) => r.name !== repo.name && r.featured).slice(0, 3),
    [repos, repo.name]
  );

  return (
    <>
      <article>
        <StudioContainer className="pb-12 pt-12 md:pt-16">
          <Link to="/github" className="studio-link text-sm font-medium">
            <span aria-hidden="true">←</span> All projects
          </Link>

          <div className="mt-6 max-w-[760px]">
            <h1 className="text-[36px] font-semibold leading-[1.08] tracking-[-0.03em] text-foreground sm:text-[48px]">
              {name}
            </h1>
            {tagline && tagline !== name && (
              <p className="mt-4 text-[18px] leading-[1.5] text-foreground/75 sm:text-[19px]">{tagline}</p>
            )}
            <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[12.5px] text-muted-foreground">
              {repo.language && <span className="rounded border border-border px-1.5 py-px">{repo.language}</span>}
              {updated && <span>Updated {updated}</span>}
              {repo.stars > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>★ {repo.stars}</span>
                </>
              )}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {repo.homepage && (
                <a
                  href={repo.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${pill} bg-primary text-primary-foreground hover:bg-primary/85`}
                >
                  Open live site <span aria-hidden="true" className="ml-1.5">↗</span>
                </a>
              )}
              <a
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${pill} ${
                  repo.homepage
                    ? 'border border-foreground/15 text-foreground hover:bg-muted/60'
                    : 'bg-primary text-primary-foreground hover:bg-primary/85'
                }`}
              >
                View on GitHub <span aria-hidden="true" className="ml-1.5">↗</span>
              </a>
            </div>
          </div>

          {mainImage && (
            <div className="mt-10 aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-muted">
              <OptimizedImage
                src={mainImage}
                alt={`${name} screenshot`}
                className="h-full w-full object-cover object-top"
                priority
                displayWidth={1280}
                sizes="(min-width: 1120px) 1072px, 100vw"
                width={1280}
                height={720}
              />
            </div>
          )}

          <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-16">
            <div className="min-w-0 space-y-10">
              {description && description !== tagline && (
                <section>
                  <SectionTitle>Overview</SectionTitle>
                  <p className="max-w-[68ch] text-[17px] leading-[1.7] text-foreground/85">{description}</p>
                </section>
              )}
              {repo.problem_statement && (
                <section>
                  <SectionTitle>The problem</SectionTitle>
                  <div className="studio-article">
                    <MarkdownContent content={repo.problem_statement} blankLineSpacers={false} />
                  </div>
                </section>
              )}
              {repo.why_it_matters && (
                <section>
                  <SectionTitle>Why it matters</SectionTitle>
                  <div className="studio-article">
                    <MarkdownContent content={repo.why_it_matters} blankLineSpacers={false} />
                  </div>
                </section>
              )}
              {repo.readme_content && (
                <section>
                  <SectionTitle>About this project</SectionTitle>
                  <div className="studio-article border-t border-border pt-6">
                    <MarkdownContent content={repo.readme_content} blankLineSpacers={false} />
                  </div>
                </section>
              )}
              {gallery.length > 0 && (
                <section>
                  <SectionTitle>Gallery</SectionTitle>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {gallery.map((img) => (
                      <div key={img.id} className="aspect-[16/9] overflow-hidden rounded-xl border border-border bg-muted">
                        <OptimizedImage
                          src={img.image_url}
                          alt={img.alt_text || `${name} screenshot`}
                          className="h-full w-full object-cover object-top"
                          displayWidth={640}
                          sizes="(min-width: 640px) 50vw, 100vw"
                          width={640}
                          height={360}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <aside className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:self-start">
              {(repo.language || topics.length > 0) && (
                <div>
                  <h2 className="mb-2.5 font-mono text-xs text-muted-foreground">Stack</h2>
                  <ul className="flex flex-wrap gap-1.5">
                    {[repo.language, ...topics].filter(Boolean).map((t) => (
                      <li key={t as string} className="rounded border border-border px-[7px] py-[2px] font-mono text-xs text-foreground/75">
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="rounded-[14px] border border-border bg-muted/40 p-5">
                <p className="text-[15px] font-semibold text-foreground">Need something like this?</p>
                <p className="mt-1.5 text-[14px] leading-[1.55] text-muted-foreground">
                  I build and lead products like this, from first prototype to scale.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to="/contact"
                    className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-[13.5px] font-medium text-primary-foreground hover:bg-primary/85"
                  >
                    Contact me
                  </Link>
                  <Link
                    to="/chat"
                    className="inline-flex h-9 items-center rounded-full border border-foreground/15 px-4 text-[13.5px] font-medium text-foreground hover:bg-muted"
                  >
                    Ask Magnet
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </StudioContainer>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="more-projects" className="border-t border-border/70">
          <StudioContainer className="py-16 md:py-20">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <h2 id="more-projects" className={studioH2}>
                More projects
              </h2>
              <Link to="/github" className="studio-link text-sm font-medium">
                All {repos.length} projects <span aria-hidden="true">→</span>
              </Link>
            </div>
            <WorkList repos={related} showLanguages />
          </StudioContainer>
        </section>
      )}
    </>
  );
};

export default ProjectCaseStudyStudio;
