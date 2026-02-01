// ============================================
// Blog Post Editor
// Full-featured editor for creating/editing blog posts
// ============================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useCreateBlogPost, useUpdateBlogPost, useBlogCategories } from '@/models/blog';
import { fetchCategoriesForPost } from '@/data/blog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  Settings,
  Search as SearchIcon,
  Image as ImageIcon,
  Calendar as CalendarIcon,
  Eye,
  Star,
  X,
  Check,
} from 'lucide-react';
import ImageUpload from './ImageUpload';
import { calculateReadingTime, generateSlug } from '@/types/blog';
import type { BlogPost, BlogPostStatus } from '@/types/blog';
import ReactMarkdown from 'react-markdown';

interface BlogPostEditorProps {
  post?: BlogPost | null;
  onClose: () => void;
}

const BlogPostEditor = ({ post, onClose }: BlogPostEditorProps) => {
  const { toast } = useToast();
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const { data: allCategories = [] } = useBlogCategories(true);

  const isEditing = !!post;

  // Form state
  const [title, setTitle] = useState(post?.title || '');
  const [slug, setSlug] = useState(post?.slug || '');
  const [content, setContent] = useState(post?.content || '');
  const [excerpt, setExcerpt] = useState(post?.excerpt || '');
  const [coverImageUrl, setCoverImageUrl] = useState(post?.cover_image_url || '');
  const [coverImagePath, setCoverImagePath] = useState(post?.cover_image_path || '');
  const [authorName, setAuthorName] = useState(post?.author_name || 'Admin');
  const [status, setStatus] = useState<BlogPostStatus>(post?.status || 'draft');
  const [scheduledFor, setScheduledFor] = useState<Date | undefined>(
    post?.scheduled_for ? new Date(post.scheduled_for) : undefined
  );
  const [featured, setFeatured] = useState(post?.featured || false);
  const [seoTitle, setSeoTitle] = useState(post?.seo_title || '');
  const [seoDescription, setSeoDescription] = useState(post?.seo_description || '');
  const [seoKeywords, setSeoKeywords] = useState(post?.seo_keywords?.join(', ') || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Load categories for existing post
  useEffect(() => {
    if (post?.id) {
      fetchCategoriesForPost(post.id).then((cats) => {
        setSelectedCategories(cats.map((c) => c.id));
      });
    }
  }, [post?.id]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugManuallyEdited && !isEditing) {
      setSlug(generateSlug(title));
    }
  }, [title, slugManuallyEdited, isEditing]);

  // Calculate reading time
  const readingTime = calculateReadingTime(content);

  const handleSave = async (saveStatus?: BlogPostStatus) => {
    const finalStatus = saveStatus || status;

    if (!title.trim()) {
      toast({ title: 'Error', description: 'Title is required.', variant: 'destructive' });
      return;
    }

    if (!slug.trim()) {
      toast({ title: 'Error', description: 'Slug is required.', variant: 'destructive' });
      return;
    }

    try {
      const postData = {
        title,
        slug,
        content,
        excerpt: excerpt || undefined,
        cover_image_url: coverImageUrl || undefined,
        cover_image_path: coverImagePath || undefined,
        author_name: authorName,
        reading_time_minutes: readingTime,
        status: finalStatus,
        published_at: finalStatus === 'published' ? new Date().toISOString() : undefined,
        scheduled_for: finalStatus === 'scheduled' && scheduledFor ? scheduledFor.toISOString() : undefined,
        featured,
        seo_title: seoTitle || undefined,
        seo_description: seoDescription || undefined,
        seo_keywords: seoKeywords ? seoKeywords.split(',').map((k) => k.trim()) : undefined,
        category_ids: selectedCategories,
      };

      if (isEditing && post) {
        await updatePost.mutateAsync({ id: post.id, ...postData });
        toast({ title: 'Post updated', description: 'Your changes have been saved.' });
      } else {
        await createPost.mutateAsync(postData);
        toast({ title: 'Post created', description: 'Your new post has been created.' });
      }

      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to save post.',
        variant: 'destructive',
      });
    }
  };

  const isPending = createPost.isPending || updatePost.isPending;

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold">
              {isEditing ? 'Edit Post' : 'New Post'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {readingTime} min read · {content.split(/\s+/).filter(Boolean).length} words
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleSave('draft')} disabled={isPending}>
            Save Draft
          </Button>
          <Button onClick={() => handleSave('published')} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Publish
          </Button>
        </div>
      </div>

      {/* Editor Tabs */}
      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content" className="gap-2">
            <FileText className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-2">
            <SearchIcon className="h-4 w-4" />
            SEO
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter post title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">/blog/</span>
                  <Input
                    id="slug"
                    placeholder="post-slug"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setSlugManuallyEdited(true);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="content">Content (Markdown)</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {showPreview ? 'Edit' : 'Preview'}
                  </Button>
                </div>
                {showPreview ? (
                  <Card className="min-h-[400px]">
                    <CardContent className="prose prose-sm dark:prose-invert max-w-none p-4">
                      <ReactMarkdown>{content || '*No content yet*'}</ReactMarkdown>
                    </CardContent>
                  </Card>
                ) : (
                  <Textarea
                    id="content"
                    placeholder="Write your post content in Markdown..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[400px] font-mono text-sm"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  placeholder="Brief summary of the post (optional)..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="h-24"
                />
                <p className="text-xs text-muted-foreground">
                  {excerpt.length}/160 characters recommended
                </p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Cover Image */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Cover Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ImageUpload
                    currentImageUrl={coverImageUrl}
                    onImageChange={(url, path) => {
                      setCoverImageUrl(url);
                      setCoverImagePath(path || '');
                    }}
                    bucket="blog-images"
                    folder="covers"
                    aspectRatio="16/9"
                    compact
                  />
                </CardContent>
              </Card>

              {/* Categories */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  {allCategories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No categories yet. Create some in the Categories tab.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {allCategories.map((category) => (
                        <Badge
                          key={category.id}
                          variant={selectedCategories.includes(category.id) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => toggleCategory(category.id)}
                        >
                          {selectedCategories.includes(category.id) && (
                            <Check className="h-3 w-3 mr-1" />
                          )}
                          {category.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Publication</CardTitle>
              <CardDescription>Control when and how this post is published.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as BlogPostStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {status === 'scheduled' && (
                <div className="space-y-2">
                  <Label>Schedule for</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {scheduledFor ? format(scheduledFor, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={scheduledFor}
                        onSelect={setScheduledFor}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Featured Post</Label>
                  <p className="text-sm text-muted-foreground">
                    Highlight this post on the homepage
                  </p>
                </div>
                <Switch checked={featured} onCheckedChange={setFeatured} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Author</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="author">Author name</Label>
                <Input
                  id="author"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Engine Optimization</CardTitle>
              <CardDescription>
                Optimize how this post appears in search results.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo_title">SEO Title</Label>
                <Input
                  id="seo_title"
                  placeholder={title || 'Enter SEO title...'}
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {(seoTitle || title).length}/60 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo_description">Meta Description</Label>
                <Textarea
                  id="seo_description"
                  placeholder={excerpt || 'Enter meta description...'}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  className="h-20"
                />
                <p className="text-xs text-muted-foreground">
                  {(seoDescription || excerpt).length}/160 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo_keywords">Keywords</Label>
                <Input
                  id="seo_keywords"
                  placeholder="keyword1, keyword2, keyword3"
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Comma-separated keywords</p>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Search Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border p-4 bg-card">
                <p className="text-sm text-blue-600 hover:underline cursor-pointer">
                  {seoTitle || title || 'Post Title'}
                </p>
                <p className="text-xs text-green-700">
                  example.com/blog/{slug || 'post-slug'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {seoDescription || excerpt || 'Post description will appear here...'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BlogPostEditor;
