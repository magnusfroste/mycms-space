// ============================================
// Blog archive - Studio view
// Left-aligned title + search, category chips, and every post as a dense
// row: mono date · title + excerpt · reading time.
// ============================================

import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { StudioContainer } from '@/components/studio/StudioSection';
import type { BlogCategory, BlogPost } from '@/types/blog';

interface BlogArchiveStudioProps {
  posts: BlogPost[];
  isLoading: boolean;
  categories: BlogCategory[];
  search: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string | null;
  onCategoryChange: (slug: string | null) => void;
}

const chip = 'h-8 rounded-full px-3 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const BlogArchiveStudio: React.FC<BlogArchiveStudioProps> = ({
  posts,
  isLoading,
  categories,
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
}) => {
  const chips: Array<{ id: string; slug: string | null; name: string }> = [
    { id: 'all', slug: null, name: 'All' },
    ...categories.map((c) => ({ id: c.id, slug: c.slug, name: c.name })),
  ];

  return (
    <StudioContainer className="pb-20 pt-14 md:pb-24 md:pt-20">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8">
        <div className="min-w-0 max-w-[620px]">
          <h1 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[48px]">Writing</h1>
          <p className="mt-3 text-[17px] leading-[1.55] text-muted-foreground">
            Essays on AI strategy, digital sovereignty and building products with AI. Mostly in Swedish.
          </p>
        </div>
        <div className="relative w-full sm:w-[280px]">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <label htmlFor="blog-search" className="sr-only">
            Search posts
          </label>
          <Input
            id="blog-search"
            type="search"
            placeholder="Search posts"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 rounded-full pl-9"
          />
        </div>
      </div>

      {categories.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {chips.map((cat) => {
            const active = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                aria-pressed={active}
                onClick={() => onCategoryChange(cat.slug)}
                className={cn(
                  chip,
                  active
                    ? 'bg-primary font-medium text-primary-foreground'
                    : 'border border-border text-foreground/75 hover:border-foreground/25 hover:text-foreground'
                )}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      )}

      <p className="mt-8 font-mono text-xs text-muted-foreground" aria-live="polite">
        {isLoading ? 'Loading…' : `${posts.length} ${posts.length === 1 ? 'post' : 'posts'}`}
      </p>

      {isLoading ? (
        <div className="mt-3 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="mt-4 rounded-[14px] border border-border p-8 text-center">
          <p className="mb-4 text-muted-foreground">No posts found.</p>
          <button
            type="button"
            onClick={() => {
              onSearchChange('');
              onCategoryChange(null);
            }}
            className="inline-flex h-9 items-center rounded-full border border-foreground/15 px-4 text-sm font-medium hover:bg-muted/60"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ol className="mt-3 border-t border-border">
          {posts.map((post) => {
            const raw = post.published_at || post.created_at;
            return (
              <li key={post.id} className="border-b border-border">
                <Link
                  to={`/blog/${post.slug}`}
                  className="group grid grid-cols-1 gap-1.5 px-1 py-5 transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none md:grid-cols-[120px_minmax(0,1fr)_auto] md:gap-6"
                >
                  <time dateTime={raw} className="pt-1 font-mono text-[12.5px] text-muted-foreground">
                    {format(new Date(raw), 'yyyy-MM-dd')}
                  </time>
                  <span className="min-w-0">
                    <span className="block text-[17px] font-semibold leading-[1.4] tracking-[-0.01em] text-foreground">
                      {post.title}
                    </span>
                    {post.excerpt && (
                      <span className="mt-1.5 line-clamp-2 block text-[14.5px] leading-[1.55] text-foreground/70">
                        {post.excerpt}
                      </span>
                    )}
                  </span>
                  {post.reading_time_minutes ? (
                    <span className="hidden pt-1 font-mono text-[12.5px] text-muted-foreground md:block">
                      {post.reading_time_minutes} min
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </StudioContainer>
  );
};

export default BlogArchiveStudio;
