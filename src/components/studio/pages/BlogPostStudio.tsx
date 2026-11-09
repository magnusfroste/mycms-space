// ============================================
// Blog post - Studio view
// Readable article column (~68ch), mono meta line, hairline cover image,
// "More writing" as dense rows and a quiet contact nudge.
// ============================================

import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import MarkdownContent from '@/components/common/MarkdownContent';
import OptimizedImage from '@/components/common/OptimizedImage';
import { StudioContainer, studioH2 } from '@/components/studio/StudioSection';
import { BlogCompactList } from '@/components/blocks/studio/BlogStudio';
import type { BlogPost } from '@/types/blog';

interface BlogPostStudioProps {
  post: BlogPost;
  otherPosts: BlogPost[];
}

const BlogPostStudio: React.FC<BlogPostStudioProps> = ({ post, otherPosts }) => {
  const published = post.published_at || post.created_at;
  // Generic CMS account names are not a byline
  const author = post.author_name && !/^admin$/i.test(post.author_name.trim()) ? post.author_name : null;

  return (
    <>
      <article className="mx-auto w-full max-w-[720px] px-4 pb-16 pt-12 sm:px-6 md:pt-16">
        <Link to="/blog" className="studio-link text-sm font-medium">
          <span aria-hidden="true">←</span> Writing
        </Link>

        <h1 className="mt-6 text-[32px] font-semibold leading-[1.12] tracking-[-0.025em] text-foreground sm:text-[42px]">
          {post.title}
        </h1>

        <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[12.5px] text-muted-foreground">
          <time dateTime={published}>{format(new Date(published), 'yyyy-MM-dd')}</time>
          {post.reading_time_minutes ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{post.reading_time_minutes} min read</span>
            </>
          ) : null}
          {author && (
            <>
              <span aria-hidden="true">·</span>
              <span>{author}</span>
            </>
          )}
          {post.categories?.map((cat) => (
            <span key={cat.id} className="rounded border border-border px-1.5 py-px">
              {cat.name}
            </span>
          ))}
        </p>

        {post.cover_image_url && (
          <div className="mt-8 aspect-[16/9] overflow-hidden rounded-xl border border-border bg-muted">
            <OptimizedImage
              src={post.cover_image_url}
              alt=""
              className="h-full w-full object-cover"
              priority
              displayWidth={1280}
              sizes="(min-width: 768px) 672px, 100vw"
              width={1280}
              height={720}
            />
          </div>
        )}

        <div className="studio-article mt-10">
          <MarkdownContent content={post.content} blankLineSpacers={false} />
        </div>
      </article>

      {otherPosts.length > 0 && (
        <section aria-labelledby="more-writing" className="border-t border-border/70">
          <StudioContainer className="grid grid-cols-1 gap-8 py-16 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-12 md:py-20">
            <div>
              <h2 id="more-writing" className={studioH2}>
                More writing
              </h2>
              <Link to="/blog" className="studio-link mt-4 inline-block text-sm font-medium">
                All posts <span aria-hidden="true">→</span>
              </Link>
            </div>
            <BlogCompactList posts={otherPosts} />
          </StudioContainer>
        </section>
      )}

      <section aria-label="Contact" className="border-t border-border/70">
        <StudioContainer className="flex flex-wrap items-center justify-between gap-4 py-10">
          <p className="text-[16px] text-foreground">Want to talk about this, or about an assignment?</p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/contact"
              className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-[14px] font-medium text-primary-foreground hover:bg-primary/85"
            >
              Contact me
            </Link>
            <Link
              to="/chat"
              className="inline-flex h-10 items-center rounded-full border border-foreground/15 px-5 text-[14px] font-medium text-foreground hover:bg-muted/60"
            >
              Ask Magnet
            </Link>
          </div>
        </StudioContainer>
      </section>
    </>
  );
};

export default BlogPostStudio;
