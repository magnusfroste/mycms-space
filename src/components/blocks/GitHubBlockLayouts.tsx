// ============================================
// GitHub Block Layouts
// Individual layout components for GitHubBlock
// ============================================

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  GitFork, 
  ExternalLink, 
  Github, 
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import type { GitHubRepoWithImages } from '@/data/githubRepos';
import TechBadge from '@/components/common/TechBadge';

interface LayoutProps {
  repos: GitHubRepoWithImages[];
  showStats?: boolean;
  showLanguages?: boolean;
  showTopics?: boolean;
  showImages?: boolean;
  showProblemStatement?: boolean;
  showWhyItMatters?: boolean;
  showForks?: boolean;
}

// ============================================
// Project Cards Layout
// Large cards with image, title, problem & why it matters
// ============================================
export const ProjectCardsLayout: React.FC<LayoutProps> = ({
  repos,
  showStats = true,
  showImages = true,
  showProblemStatement = true,
  showWhyItMatters = true,
  showForks = true,
}) => {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      {repos.map(repo => {
        const title = repo.enriched_title || repo.name;
        const description = repo.enriched_description || repo.description;
        const mainImage = repo.images?.[0]?.image_url;

        return (
          <Card key={repo.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300">
            {showImages && mainImage && (
              <div className="aspect-video overflow-hidden bg-muted">
                <img
                  src={mainImage}
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            )}
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {title}
                </CardTitle>
                {showStats && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground flex-shrink-0">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      {repo.stars}
                    </span>
                    {showForks && (
                      <span className="flex items-center gap-1">
                        <GitFork className="w-4 h-4" />
                        {repo.forks}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {repo.language && (
                <Badge variant="secondary" className="w-fit flex items-center gap-1.5 mt-2">
                  <span className={`w-2 h-2 rounded-full ${languageColors[repo.language] || 'bg-gray-400'}`} />
                  {repo.language}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {description && (
                <p className="text-muted-foreground">{description}</p>
              )}
              
              {showProblemStatement && repo.problem_statement && (
                <div className="p-4 rounded-lg bg-muted/50 border-l-4 border-primary">
                  <p className="text-sm font-medium mb-1">The Problem</p>
                  <p className="text-sm text-muted-foreground">{repo.problem_statement}</p>
                </div>
              )}

              {showWhyItMatters && repo.why_it_matters && (
                <div className="p-4 rounded-lg bg-primary/5 border-l-4 border-primary/50">
                  <p className="text-sm font-medium mb-1">Why It Matters</p>
                  <p className="text-sm text-muted-foreground">{repo.why_it_matters}</p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4">
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium"
                >
                  <Github className="w-4 h-4" />
                  View on GitHub
                </a>
                {repo.homepage && (
                  <a
                    href={repo.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium"
                  >
                    Live Demo
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// ============================================
// Classic Grid Layout
// Compact cards in 3-column grid
// ============================================
export const ClassicGridLayout: React.FC<LayoutProps> = ({
  repos,
  showStats = true,
  showLanguages = true,
  showTopics = true,
  showForks = true,
}) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {repos.map(repo => (
        <Card key={repo.id} className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50">
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
                  {repo.enriched_title || repo.name}
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </CardTitle>
              {showStats && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    {repo.stars}
                  </span>
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
            {(repo.enriched_description || repo.description) && (
              <p className="text-muted-foreground text-sm line-clamp-2">
                {repo.enriched_description || repo.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {showLanguages && repo.language && (
                <Badge variant="secondary" className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${languageColors[repo.language] || 'bg-gray-400'}`} />
                  {repo.language}
                </Badge>
              )}
              {showTopics && repo.topics?.slice(0, 3).map((topic) => (
                <Badge key={topic} variant="outline" className="text-xs">
                  {topic}
                </Badge>
              ))}
            </div>
            {repo.homepage && (
              <a
                href={repo.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline text-xs font-medium mt-2"
              >
                Live Demo
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// ============================================
// Showcase Hero Layout
// One repo at a time with large image and full info (carousel)
// ============================================
export const ShowcaseHeroLayout: React.FC<LayoutProps> = ({
  repos,
  showStats = true,
  showImages = true,
  showProblemStatement = true,
  showWhyItMatters = true,
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const repo = repos[currentIndex];
  
  if (!repo) return null;

  const title = repo.enriched_title || repo.name;
  const description = repo.enriched_description || repo.description;
  const mainImage = repo.images?.[0]?.image_url;

  const goNext = () => setCurrentIndex((i) => (i + 1) % repos.length);
  const goPrev = () => setCurrentIndex((i) => (i - 1 + repos.length) % repos.length);

  return (
    <div className="relative">
      <div className="grid lg:grid-cols-2 gap-8 items-center">
        {/* Image */}
        {showImages && (
          <div className="aspect-video lg:aspect-[4/3] rounded-xl overflow-hidden bg-muted">
            {mainImage ? (
              <img
                src={mainImage}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Github className="w-16 h-16 text-muted-foreground/30" />
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {repo.language && (
                <Badge variant="secondary" className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${languageColors[repo.language] || 'bg-gray-400'}`} />
                  {repo.language}
                </Badge>
              )}
              {showStats && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    {repo.stars}
                  </span>
                </div>
              )}
            </div>
            <h3 className="text-3xl font-bold mb-4">{title}</h3>
            {description && (
              <p className="text-lg text-muted-foreground">{description}</p>
            )}
          </div>

          {showProblemStatement && repo.problem_statement && (
            <div className="p-4 rounded-lg bg-muted/50 border-l-4 border-primary">
              <p className="text-sm font-medium mb-1">The Problem</p>
              <p className="text-muted-foreground">{repo.problem_statement}</p>
            </div>
          )}

          {showWhyItMatters && repo.why_it_matters && (
            <div className="p-4 rounded-lg bg-primary/5 border-l-4 border-primary/50">
              <p className="text-sm font-medium mb-1">Why It Matters</p>
              <p className="text-muted-foreground">{repo.why_it_matters}</p>
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button asChild>
              <a href={repo.url} target="_blank" rel="noopener noreferrer">
                <Github className="w-4 h-4 mr-2" />
                View on GitHub
              </a>
            </Button>
            {repo.homepage && (
              <Button variant="outline" asChild>
                <a href={repo.homepage} target="_blank" rel="noopener noreferrer">
                  Live Demo
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      {repos.length > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <Button variant="outline" size="icon" onClick={goPrev}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex gap-2">
            {repos.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
          <Button variant="outline" size="icon" onClick={goNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

// ============================================
// Minimal List Layout
// Simple list with repo name, description and quick link
// ============================================
export const MinimalListLayout: React.FC<LayoutProps> = ({
  repos,
  showLanguages = true,
  showStats = true,
}) => {
  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {repos.map(repo => (
        <a
          key={repo.id}
          href={repo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between py-4 px-6 rounded-lg border hover:bg-muted/50 hover:border-primary/50 transition-colors group"
        >
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <Github className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium group-hover:text-primary transition-colors">
                  {repo.enriched_title || repo.name}
                </span>
                {showLanguages && repo.language && (
                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${languageColors[repo.language] || 'bg-gray-400'}`} />
                    {repo.language}
                  </Badge>
                )}
              </div>
              {(repo.enriched_description || repo.description) && (
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {repo.enriched_description || repo.description}
                </p>
              )}
              {repo.homepage && (
                <span className="text-xs text-primary truncate mt-0.5 block">
                  {repo.homepage.replace(/^https?:\/\//, '')}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0 ml-4">
            {showStats && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="w-4 h-4" />
                {repo.stars}
              </span>
            )}
            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </a>
      ))}
    </div>
  );
};
