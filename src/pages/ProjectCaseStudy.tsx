// ============================================
// Project Case Study Page
// Editorial layout: CMS storytelling + GitHub data
// ============================================

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, GitFork, Github, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/common/SEOHead';
import MarkdownContent from '@/components/common/MarkdownContent';
import TechBadge from '@/components/common/TechBadge';
import { useGitHubRepoByName } from '@/models/githubRepoByName';

const ProjectCaseStudy = () => {
  const { repoName } = useParams<{ repoName: string }>();
  const navigate = useNavigate();
  const { data: repo, isLoading, error } = useGitHubRepoByName(repoName);

  // 404 redirect
  React.useEffect(() => {
    if (!isLoading && !repo && !error) {
      navigate('/404', { replace: true });
    }
  }, [isLoading, repo, error, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-full mb-8" />
          <Skeleton className="aspect-video w-full mb-8 rounded-xl" />
          <Skeleton className="h-40 w-full mb-6" />
          <Skeleton className="h-40 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!repo) return null;

  const title = repo.enriched_title || repo.name;
  const description = repo.enriched_description || repo.description;
  const mainImage = repo.images?.[0]?.image_url;
  const additionalImages = repo.images?.slice(1) || [];
  const topics = repo.topics || [];

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={title}
        description={description || `Project: ${title}`}
        ogImage={mainImage}
      />
      <Header />

      <main className="flex-1">
        <article className="container mx-auto px-4 py-8 md:py-16 max-w-4xl">
          {/* Back link */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {/* Meta: language + stats */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {repo.language && (
              <TechBadge name={repo.language} />
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                {repo.stars}
              </span>
              <span className="flex items-center gap-1">
                <GitFork className="w-4 h-4" />
                {repo.forks}
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            {title}
          </h1>

          {/* Description */}
          {description && (
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              {description}
            </p>
          )}

          {/* Hero Image */}
          {mainImage && (
            <div className="aspect-video rounded-xl overflow-hidden bg-muted mb-12">
              <img
                src={mainImage}
                alt={title}
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
          )}

          {/* Problem Statement */}
          {repo.problem_statement && (
            <section className="mb-10">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                The Problem
              </h2>
              <div className="p-6 rounded-xl bg-muted/50 border-l-4 border-primary">
                <p className="text-foreground leading-relaxed">
                  {repo.problem_statement}
                </p>
              </div>
            </section>
          )}

          {/* Why It Matters */}
          {repo.why_it_matters && (
            <section className="mb-10">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Why It Matters
              </h2>
              <div className="p-6 rounded-xl bg-primary/5 border-l-4 border-primary/50">
                <p className="text-foreground leading-relaxed">
                  {repo.why_it_matters}
                </p>
              </div>
            </section>
          )}

          {/* Tech Stack */}
          {(repo.language || topics.length > 0) && (
            <section className="mb-10">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Tech Stack
              </h2>
              <div className="flex flex-wrap gap-2">
                {repo.language && (
                  <TechBadge name={repo.language} />
                )}
                {topics.map((topic) => (
                  <TechBadge key={topic} name={topic} variant="outline" showDot={false} />
                ))}
              </div>
            </section>
          )}

          {/* README */}
          {repo.readme_content && (
            <section className="mb-10">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                About This Project
              </h2>
              <div className="rounded-xl border border-border p-6 md:p-8 bg-card">
                <MarkdownContent content={repo.readme_content} />
              </div>
            </section>
          )}

          {/* Image Gallery */}
          {additionalImages.length > 0 && (
            <section className="mb-10">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Gallery
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {additionalImages.map((img) => (
                  <div key={img.id} className="rounded-xl overflow-hidden bg-muted aspect-video">
                    <img
                      src={img.image_url}
                      alt={img.alt_text || title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-border">
            <Button asChild size="lg">
              <a href={repo.url} target="_blank" rel="noopener noreferrer">
                <Github className="w-4 h-4 mr-2" />
                View on GitHub
              </a>
            </Button>
            {repo.homepage && (
              <Button variant="outline" size="lg" asChild>
                <a href={repo.homepage} target="_blank" rel="noopener noreferrer">
                  Live Demo
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            )}
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default ProjectCaseStudy;
