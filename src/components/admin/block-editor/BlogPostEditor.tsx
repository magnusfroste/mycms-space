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
import { toast } from 'sonner';
import { useCreateBlogPost, useUpdateBlogPost, useBlogCategories, useBlogPostById } from '@/models/blog';
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
  Star,
  Check,
} from 'lucide-react';
import ImageUpload from './ImageUpload';
import UnsplashPicker from './UnsplashPicker';
import { RichTextEditor, AITextActions, MarkdownContent } from '@/components/common';
import { calculateReadingTime, generateSlug } from '@/types/blog';
import type { BlogPost, BlogPostStatus } from '@/types/blog';

interface BlogPostEditorProps {
  postId?: string | null;
  onClose: () => void;
}

const BlogPostEditor = ({ postId, onClose }: BlogPostEditorProps) => {
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const { data: allCategories = [] } = useBlogCategories(true);
  
  // Fetch post data by ID to avoid race conditions
  const { data: post, isLoading: isLoadingPost } = useBlogPostById(postId || '');

  const isEditing = !!postId;

  // Form state - initialize empty, update when post loads
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverImagePath, setCoverImagePath] = useState('');
  const [authorName, setAuthorName] = useState('Admin');
  const [status, setStatus] = useState<BlogPostStatus>('draft');
  const [scheduledFor, setScheduledFor] = useState<Date | undefined>(undefined);
  const [featured, setFeatured] = useState(false);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize form when post data loads (only once)
  useEffect(() => {
    if (post && !isInitialized) {
      setTitle(post.title || '');
      setSlug(post.slug || '');
      setContent(post.content || '');
      setExcerpt(post.excerpt || '');
      setCoverImageUrl(post.cover_image_url || '');
      setCoverImagePath(post.cover_image_path || '');
      setAuthorName(post.author_name || 'Admin');
      setStatus(post.status || 'draft');
      setScheduledFor(post.scheduled_for ? new Date(post.scheduled_for) : undefined);
      setFeatured(post.featured || false);
      setSeoTitle(post.seo_title || '');
      setSeoDescription(post.seo_description || '');
      setSeoKeywords(post.seo_keywords?.join(', ') || '');
      setSlugManuallyEdited(true); // Don't auto-generate slug for existing posts
      setIsInitialized(true);
    }
  }, [post, isInitialized]);

  // Load categories for existing post
  useEffect(() => {
    if (post?.id && isInitialized) {
      fetchCategoriesForPost(post.id).then((cats) => {
        setSelectedCategories(cats.map((c) => c.id));
      });
    }
  }, [post?.id, isInitialized]);

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
      toast.error('Title is required.');
      return;
    }

    if (!slug.trim()) {
      toast.error('Slug is required.');
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

      if (isEditing && postId) {
        await updatePost.mutateAsync({ id: postId, ...postData });
        toast.success('Your changes have been saved.');
      } else {
        await createPost.mutateAsync(postData);
        toast.success('Your new post has been created.');
      }

      onClose();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save post.');
    }
  };

  const isPending = createPost.isPending || updatePost.isPending;

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  // Show loading state while fetching post data
  if (isEditing && isLoadingPost) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
                <Label htmlFor="content">Content (Markdown)</Label>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  title={title}
                  placeholder="Write your post content in Markdown..."
                  minHeight="min-h-[400px]"
                  showAI
                  aiMode="both"
                  aiContext="Blog post content in Markdown format"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <AITextActions
                    text={excerpt}
                    onTextChange={setExcerpt}
                    context="Blog post excerpt/summary"
                    mode="text"
                  />
                </div>
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
                <CardContent className="space-y-3">
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
                  <div className="border-t pt-3">
                    <p className="text-xs text-muted-foreground mb-2">Or search Unsplash</p>
                    <UnsplashPicker
                      onSelect={(url, alt) => {
                        setCoverImageUrl(url);
                        setCoverImagePath('');
                      }}
                    />
                  </div>
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
