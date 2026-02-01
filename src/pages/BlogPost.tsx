// ============================================
// Blog Post Page
// Dynamic page for viewing individual blog posts
// ============================================

import { useParams, Link } from 'react-router-dom';
import { useBlogPostBySlug, useBlogPosts } from '@/models/blog';
import { format } from 'date-fns';
import { ArrowLeft, Clock, User, Calendar, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ReactMarkdown from 'react-markdown';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = useBlogPostBySlug(slug || '');
  const { data: relatedPosts = [] } = useBlogPosts({ status: 'published', limit: 3 });

  // Filter out current post from related
  const otherPosts = relatedPosts.filter((p) => p.slug !== slug).slice(0, 2);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <article className="container max-w-3xl mx-auto px-4 py-16">
            <Skeleton className="h-8 w-32 mb-8" />
            <Skeleton className="h-12 w-3/4 mb-4" />
            <div className="flex gap-4 mb-8">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="aspect-video w-full mb-8 rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </article>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Post not found</h1>
            <p className="text-muted-foreground mb-6">
              The blog post you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/blog">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <article className="container max-w-3xl mx-auto px-4 py-16">
          {/* Back Link */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          {/* Categories */}
          {post.categories && post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.categories.map((cat) => (
                <Badge key={cat.id} variant="secondary">
                  <Tag className="h-3 w-3 mr-1" />
                  {cat.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{post.title}</h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-8">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {post.author_name}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(post.published_at || post.created_at), 'MMMM d, yyyy')}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.reading_time_minutes} min read
            </span>
          </div>

          {/* Cover Image */}
          {post.cover_image_url && (
            <div className="aspect-video rounded-lg overflow-hidden mb-8">
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          {/* Divider */}
          <hr className="my-12 border-border" />

          {/* Related Posts */}
          {otherPosts.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6">More Posts</h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {otherPosts.map((relatedPost) => (
                  <Link key={relatedPost.id} to={`/blog/${relatedPost.slug}`} className="group">
                    <Card className="overflow-hidden hover:border-primary/50 transition-colors h-full">
                      {relatedPost.cover_image_url && (
                        <div className="aspect-video overflow-hidden">
                          <img
                            src={relatedPost.cover_image_url}
                            alt={relatedPost.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                          {relatedPost.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {relatedPost.reading_time_minutes} min read
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;
