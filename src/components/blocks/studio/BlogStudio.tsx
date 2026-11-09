// ============================================
// Blog block - Studio variant
// 'compact-list' / 'list': heading + archive link on the left, latest posts
// as dense rows (mono date + title) on the right. Other layouts: hairline cards.
// ============================================

import React, { useId } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import OptimizedImage from '@/components/common/OptimizedImage';
import { StudioSection, StudioSectionHeader, studioH2 } from '@/components/studio/StudioSection';
import { useBlogPosts, usePublishedPostCount } from '@/models/blog';
import type { BlogBlockConfig, BlogPost } from '@/types/blog';

const postDate = (post: BlogPost) => {
  const raw = post.published_at || post.created_at;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : { iso: raw, label: format(date, 'yyyy-MM-dd') };
};

/** Dense post rows: mono date + title. Shared with the classic theme's compact-list layout. */
export const BlogCompactList: React.FC<{ posts: BlogPost[]; className?: string }> = ({ posts, className }) => (
  <ol className={`border-t border-border ${className || ''}`}>
    {posts.map((post) => {
      const date = postDate(post);
      return (
        <li key={post.id} className="border-b border-border">
          <Link
            to={`/blog/${post.slug}`}
            className="group flex flex-col gap-1 px-1 py-4 text-foreground transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none sm:flex-row sm:items-baseline sm:gap-6 sm:py-[18px]"
          >
            {date && (
              <time dateTime={date.iso} className="shrink-0 font-mono text-[12.5px] text-muted-foreground sm:w-[90px]">
                {date.label}
              </time>
            )}
            <span className="min-w-0 text-[16px] font-medium leading-[1.45] group-hover:text-foreground/80">
              {post.title}
            </span>
          </Link>
        </li>
      );
    })}
  </ol>
);

const BlogCards: React.FC<{ posts: BlogPost[]; showExcerpt: boolean }> = ({ posts, showExcerpt }) => (
  <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {posts.map((post) => {
      const date = postDate(post);
      return (
        <li key={post.id} className="min-w-0">
          <Link
            to={`/blog/${post.slug}`}
            className="group flex h-full flex-col overflow-hidden rounded-[14px] border border-border bg-card transition-colors hover:border-foreground/20"
          >
            {post.cover_image_url && (
              <div className="aspect-[16/9] overflow-hidden border-b border-border bg-muted">
                <OptimizedImage
                  src={post.cover_image_url}
                  alt=""
                  className="h-full w-full object-cover"
                  displayWidth={640}
                  sizes="(min-width: 1024px) 352px, (min-width: 640px) 50vw, 100vw"
                  width={640}
                  height={360}
                />
              </div>
            )}
            <div className="flex flex-1 flex-col gap-2 p-5">
              {date && (
                <time dateTime={date.iso} className="font-mono text-[12px] text-muted-foreground">
                  {date.label}
                </time>
              )}
              <h3 className="text-[16px] font-semibold leading-snug text-foreground">{post.title}</h3>
              {showExcerpt && post.excerpt && (
                <p className="line-clamp-2 text-[14px] leading-[1.55] text-foreground/75">{post.excerpt}</p>
              )}
            </div>
          </Link>
        </li>
      );
    })}
  </ul>
);

const BlogStudio: React.FC<{ config: BlogBlockConfig }> = ({ config }) => {
  const headingId = useId();
  const displayMode = config.display_mode || 'latest';
  const layout = config.layout || 'grid';
  const isList = layout === 'compact-list' || layout === 'list';
  const postsCount = config.posts_count || (isList ? 3 : 6);
  const heading = config.heading || 'Writing';
  const subheading = config.subheading || '';

  const { data: posts = [], isLoading } = useBlogPosts({
    status: 'published',
    featured: displayMode === 'featured' ? true : undefined,
    categorySlug: displayMode === 'category' ? config.category_filter : undefined,
    limit: postsCount,
  });
  const { data: totalPosts } = usePublishedPostCount();

  const displayPosts =
    displayMode === 'selected' && config.selected_post_ids?.length
      ? posts.filter((p) => config.selected_post_ids?.includes(p.id))
      : posts;

  if (!isLoading && displayPosts.length === 0) return null;

  const viewAllText = config.view_all_text || (totalPosts ? `All ${totalPosts} posts` : 'All posts');
  const viewAll = (
    <Link to="/blog" className="studio-link inline-block text-sm font-medium">
      {viewAllText} <span aria-hidden="true">→</span>
    </Link>
  );

  const loading = (
    <div className="space-y-3">
      {Array.from({ length: Math.min(postsCount, 3) }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-md" />
      ))}
    </div>
  );

  if (isList) {
    return (
      <StudioSection labelledBy={headingId}>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-12">
          <div className="min-w-0">
            <h2 id={headingId} className={studioH2}>
              {heading}
            </h2>
            {subheading && <p className="mt-2.5 text-[15px] leading-[1.55] text-muted-foreground">{subheading}</p>}
            <div className="mt-4">{viewAll}</div>
          </div>
          <div className="min-w-0">{isLoading ? loading : <BlogCompactList posts={displayPosts} />}</div>
        </div>
      </StudioSection>
    );
  }

  return (
    <StudioSection labelledBy={headingId}>
      <div className="flex flex-col gap-6">
        <StudioSectionHeader
          id={headingId}
          title={heading}
          subtitle={subheading}
          action={{ label: viewAllText, href: '/blog' }}
        />
        {isLoading ? loading : <BlogCards posts={displayPosts} showExcerpt={config.show_excerpt ?? true} />}
      </div>
    </StudioSection>
  );
};

export default BlogStudio;
