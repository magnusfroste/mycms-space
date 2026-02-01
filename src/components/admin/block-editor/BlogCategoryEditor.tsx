// ============================================
// Blog Category Editor
// Simple editor for creating/editing blog categories
// ============================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useCreateBlogCategory, useUpdateBlogCategory } from '@/models/blog';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { generateSlug } from '@/types/blog';
import type { BlogCategory } from '@/types/blog';

interface BlogCategoryEditorProps {
  category?: BlogCategory | null;
  onClose: () => void;
}

const BlogCategoryEditor = ({ category, onClose }: BlogCategoryEditorProps) => {
  const { toast } = useToast();
  const createCategory = useCreateBlogCategory();
  const updateCategory = useUpdateBlogCategory();

  const isEditing = !!category;

  const [name, setName] = useState(category?.name || '');
  const [slug, setSlug] = useState(category?.slug || '');
  const [description, setDescription] = useState(category?.description || '');
  const [enabled, setEnabled] = useState(category?.enabled ?? true);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugManuallyEdited && !isEditing) {
      setSlug(generateSlug(name));
    }
  }, [name, slugManuallyEdited, isEditing]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Error', description: 'Name is required.', variant: 'destructive' });
      return;
    }

    if (!slug.trim()) {
      toast({ title: 'Error', description: 'Slug is required.', variant: 'destructive' });
      return;
    }

    try {
      const categoryData = {
        name,
        slug,
        description: description || undefined,
        enabled,
      };

      if (isEditing && category) {
        await updateCategory.mutateAsync({ id: category.id, ...categoryData });
        toast({ title: 'Category updated', description: 'Your changes have been saved.' });
      } else {
        await createCategory.mutateAsync(categoryData);
        toast({ title: 'Category created', description: 'Your new category has been created.' });
      }

      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to save category.',
        variant: 'destructive',
      });
    }
  };

  const isPending = createCategory.isPending || updateCategory.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-semibold">
            {isEditing ? 'Edit Category' : 'New Category'}
          </h2>
        </div>

        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Category
        </Button>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
          <CardDescription>
            Categories help organize your blog posts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g., Technology, Design, Business"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">/blog/category/</span>
              <Input
                id="slug"
                placeholder="category-slug"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugManuallyEdited(true);
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this category (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-24"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="space-y-0.5">
              <Label>Enabled</Label>
              <p className="text-sm text-muted-foreground">
                Disabled categories won't appear on the site
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BlogCategoryEditor;
