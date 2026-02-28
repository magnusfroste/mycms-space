// ============================================
// Blog Manager
// Admin interface for managing blog posts and categories
// ============================================

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  useBlogPosts,
  useBlogCategories,
  useDeleteBlogPost,
  useDeleteBlogCategory,
} from '@/models/blog';
import { format } from 'date-fns';
import {
  Plus,
  Search,
  
  Edit,
  Trash2,
  Eye,
  Clock,
  Calendar,
  Loader2,
  FileText,
  Tag,
  Star,
} from 'lucide-react';
import BlogPostEditor from './block-editor/BlogPostEditor';
import BlogCategoryEditor from './block-editor/BlogCategoryEditor';
import type { BlogPost, BlogCategory } from '@/types/blog';

const BlogManager = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('posts');
  const [search, setSearch] = useState('');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

  // Open editor if navigated with editPostId param
  useEffect(() => {
    const editId = searchParams.get('editPostId');
    if (editId) {
      setEditingPostId(editId);
      searchParams.delete('editPostId');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: posts = [], isLoading: postsLoading } = useBlogPosts();
  const { data: categories = [], isLoading: categoriesLoading } = useBlogCategories(true);
  const deletePost = useDeleteBlogPost();
  const deleteCategory = useDeleteBlogCategory();

  // Note: Realtime subscriptions removed to prevent re-render issues with dropdowns
  // React Query already handles cache updates after mutations

  // Filter posts based on search
  const filteredPosts = useMemo(() => posts.filter(
    (post) =>
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.slug.toLowerCase().includes(search.toLowerCase())
  ), [posts, search]);

  // Filter categories based on search
  const filteredCategories = useMemo(() => categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      cat.slug.toLowerCase().includes(search.toLowerCase())
  ), [categories, search]);

  const handleDeletePost = useCallback(async () => {
    if (!deletePostId) return;
    try {
      await deletePost.mutateAsync(deletePostId);
      toast.success('The blog post has been deleted.');
      setDeletePostId(null);
    } catch (error) {
      toast.error('Failed to delete post.');
    }
  }, [deletePostId, deletePost]);

  const handleDeleteCategory = useCallback(async () => {
    if (!deleteCategoryId) return;
    try {
      await deleteCategory.mutateAsync(deleteCategoryId);
      toast.success('The category has been deleted.');
      setDeleteCategoryId(null);
    } catch (error) {
      toast.error('Failed to delete category.');
    }
  }, [deleteCategoryId, deleteCategory]);

  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Published</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">Scheduled</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  }, []);

  // Show editor if creating or editing
  if (isCreatingPost || editingPostId) {
    return (
      <BlogPostEditor
        postId={editingPostId}
        onClose={() => {
          setEditingPostId(null);
          setIsCreatingPost(false);
        }}
      />
    );
  }

  if (isCreatingCategory || editingCategory) {
    return (
      <BlogCategoryEditor
        category={editingCategory}
        onClose={() => {
          setEditingCategory(null);
          setIsCreatingCategory(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Blog
          </h2>
          <p className="text-muted-foreground mt-1">
            Create and manage blog posts and categories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>
          <Button
            onClick={() =>
              activeTab === 'posts' ? setIsCreatingPost(true) : setIsCreatingCategory(true)
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            {activeTab === 'posts' ? 'New Post' : 'New Category'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="posts" className="gap-2">
            <FileText className="h-4 w-4" />
            Posts ({posts.length})
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <Tag className="h-4 w-4" />
            Categories ({categories.length})
          </TabsTrigger>
        </TabsList>

        {/* Posts Tab */}
        <TabsContent value="posts" className="mt-6">
          {postsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-1">No posts yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first blog post to get started.
                </p>
                <Button onClick={() => setIsCreatingPost(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredPosts.map((post) => (
                <Card key={post.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Cover Image */}
                      {post.cover_image_url && (
                        <div className="w-20 h-14 rounded-md overflow-hidden shrink-0 bg-muted">
                          <img
                            src={post.cover_image_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium truncate">{post.title}</h4>
                              {post.featured && (
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              /{post.slug}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {getStatusBadge(post.status)}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditingPostId(post.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {post.status === 'published' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeletePostId(post.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.reading_time_minutes} min read
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(post.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="mt-6">
          {categoriesLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCategories.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Tag className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-1">No categories yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create categories to organize your blog posts.
                </p>
                <Button onClick={() => setIsCreatingCategory(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Category
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCategories.map((category) => (
                <Card key={category.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{category.name}</h4>
                          {!category.enabled && (
                            <Badge variant="outline" className="text-xs">
                              Disabled
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">/{category.slug}</p>
                        {category.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {category.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingCategory(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteCategoryId(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Post Dialog */}
      <AlertDialog open={!!deletePostId} onOpenChange={() => setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The post will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Category Dialog */}
      <AlertDialog open={!!deleteCategoryId} onOpenChange={() => setDeleteCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Posts in this category will not be deleted, but will no
              longer be associated with this category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BlogManager;
