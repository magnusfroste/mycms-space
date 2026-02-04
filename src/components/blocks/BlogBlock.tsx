// ============================================
// Blog Block
// Displays blog posts with configurable layout
// ============================================

import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useBlogPosts, useBlogCategories } from '@/models/blog';
import { format } from 'date-fns';
import { Clock, User, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BlogBlockConfig } from '@/types/blog';
import type { BlogPost } from '@/types/blog';

interface BlogBlockProps {
  config: BlogBlockConfig;
}

const BlogBlock = ({ config }: BlogBlockProps) => {
  const displayMode = config.display_mode || 'latest';
  const layout = config.layout || 'grid';
  const postsCount = config.posts_count || 6;
  const showExcerpt = config.show_excerpt ?? true;
  const showReadingTime = config.show_reading_time ?? true;
  const showCategories = config.show_categories ?? true;
  const showAuthor = config.show_author ?? false;
  const heading = config.heading || 'Latest Posts';
  const subheading = config.subheading || '';

  // Fetch posts based on display mode
  const { data: posts = [], isLoading } = useBlogPosts({
    status: 'published',
    featured: displayMode === 'featured' ? true : undefined,
    categorySlug: displayMode === 'category' ? config.category_filter : undefined,
    limit: postsCount,
  });

  // Filter selected posts if in 'selected' mode
  const displayPosts =
    displayMode === 'selected' && config.selected_post_ids?.length
      ? posts.filter((p) => config.selected_post_ids?.includes(p.id))
      : posts;

  if (isLoading) {
    return (
      <section className="section-container">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-48 rounded-t-lg" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (displayPosts.length === 0) {
    return null;
  }

  const renderPost = (post: BlogPost, index: number) => {
    const postUrl = `/blog/${post.slug}`;

    if (layout === 'list') {
      return (
        <Link key={post.id} to={postUrl} className="block group">
          <Card className="overflow-hidden hover:border-primary/50 transition-colors">
            <div className="flex flex-col sm:flex-row">
              {post.cover_image_url && (
                <div className="sm:w-48 sm:shrink-0">
                  <img
                    src={post.cover_image_url}
                    alt={post.title}
                    className="w-full h-40 sm:h-full object-cover"
                  />
                </div>
              )}
              <CardContent className="p-4 flex-1">
                <div className="flex flex-wrap gap-2 mb-2">
                  {showCategories &&
                    post.categories?.map((cat) => (
                      <Badge key={cat.id} variant="secondary" className="text-xs">
                        {cat.name}
                      </Badge>
                    ))}
                </div>
                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                {showExcerpt && post.excerpt && (
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                    {post.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {showAuthor && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {post.author_name}
                    </span>
                  )}
                  {showReadingTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.reading_time_minutes} min
                    </span>
                  )}
                  <span>{format(new Date(post.created_at), 'MMM d, yyyy')}</span>
                </div>
              </CardContent>
            </div>
          </Card>
        </Link>
      );
    }

    if (layout === 'magazine' && index === 0) {
      // Featured first post in magazine layout
      return (
        <Link key={post.id} to={postUrl} className="block group col-span-full lg:col-span-2">
          <Card className="overflow-hidden hover:border-primary/50 transition-colors h-full">
            <div className="grid lg:grid-cols-2 h-full">
              {post.cover_image_url && (
                <div className="relative h-64 lg:h-full">
                  <img
                    src={post.cover_image_url}
                    alt={post.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              )}
              <CardContent className="p-6 flex flex-col justify-center">
                <div className="flex flex-wrap gap-2 mb-3">
                  {showCategories &&
                    post.categories?.map((cat) => (
                      <Badge key={cat.id} variant="secondary">
                        {cat.name}
                      </Badge>
                    ))}
                </div>
                <h3 className="font-bold text-2xl mb-3 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                {showExcerpt && post.excerpt && (
                  <p className="text-muted-foreground mb-4 line-clamp-3">{post.excerpt}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {showAuthor && (
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {post.author_name}
                    </span>
                  )}
                  {showReadingTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {post.reading_time_minutes} min read
                    </span>
                  )}
                </div>
              </CardContent>
            </div>
          </Card>
        </Link>
      );
    }

    // Grid / Cards / Magazine (non-first) layout
    return (
      <Link key={post.id} to={postUrl} className="block group">
        <Card className="overflow-hidden h-full hover:border-primary/50 transition-colors">
          {post.cover_image_url && (
            <div className="relative aspect-video overflow-hidden">
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2 mb-2">
              {showCategories &&
                post.categories?.map((cat) => (
                  <Badge key={cat.id} variant="secondary" className="text-xs">
                    {cat.name}
                  </Badge>
                ))}
            </div>
            <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
              {post.title}
            </h3>
            {showExcerpt && post.excerpt && (
              <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{post.excerpt}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {showReadingTime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {post.reading_time_minutes} min
                </span>
              )}
              <span>{format(new Date(post.created_at), 'MMM d')}</span>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  const gridClasses = cn('gap-6', {
    'grid sm:grid-cols-2 lg:grid-cols-3': layout === 'grid' || layout === 'cards' || layout === 'magazine',
    'flex flex-col': layout === 'list',
  });

  return (
    <section className="section-container">
      <div className="container px-4 md:px-6">
        {/* Header */}
        {(heading || subheading) && (
          <div className="text-center mb-12">
            {heading && <h2 className="text-3xl font-bold mb-2">{heading}</h2>}
            {subheading && <p className="text-muted-foreground max-w-2xl mx-auto">{subheading}</p>}
          </div>
        )}

        {/* Posts Grid */}
        <div className={gridClasses}>{displayPosts.map((post, i) => renderPost(post, i))}</div>

        {/* View All Link */}
        <div className="text-center mt-10">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
          >
            View all posts
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BlogBlock;
