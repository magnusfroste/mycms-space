// ============================================
// Blog Module Settings
// Global configuration for the blog feature
// ============================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useModule, useUpdateModule } from '@/models/modules';
import { BookOpen, Save, Loader2 } from 'lucide-react';
import type { BlogModuleConfig } from '@/types/modules';

const BlogModuleSettings = () => {
  const { toast } = useToast();
  const { data: blogModule, isLoading } = useModule('blog');
  const updateModule = useUpdateModule('blog');

  const [config, setConfig] = useState<BlogModuleConfig>({
    posts_per_page: 10,
    show_reading_time: true,
    show_author: true,
    show_categories: true,
    default_cover_image: '',
    enable_comments: false,
    date_format: 'MMMM d, yyyy',
  });

  // Sync with database
  useEffect(() => {
    if (blogModule?.module_config) {
      const moduleConfig = blogModule.module_config as BlogModuleConfig;
      setConfig({
        posts_per_page: moduleConfig.posts_per_page ?? 10,
        show_reading_time: moduleConfig.show_reading_time ?? true,
        show_author: moduleConfig.show_author ?? true,
        show_categories: moduleConfig.show_categories ?? true,
        default_cover_image: moduleConfig.default_cover_image ?? '',
        enable_comments: moduleConfig.enable_comments ?? false,
        date_format: moduleConfig.date_format ?? 'MMMM d, yyyy',
      });
    }
  }, [blogModule]);

  const handleSave = async () => {
    try {
      await updateModule.mutateAsync({
        module_config: config,
      });
      toast({
        title: 'Settings saved',
        description: 'Blog settings have been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Blog Settings
        </h2>
        <p className="text-muted-foreground mt-1">
          Configure global settings for your blog.
        </p>
      </div>

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Display Settings</CardTitle>
          <CardDescription>
            Control how blog posts are displayed on your site.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="posts_per_page">Posts per page</Label>
              <Input
                id="posts_per_page"
                type="number"
                min={1}
                max={50}
                value={config.posts_per_page}
                onChange={(e) =>
                  setConfig({ ...config, posts_per_page: parseInt(e.target.value) || 10 })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_format">Date format</Label>
              <Select
                value={config.date_format}
                onValueChange={(value) => setConfig({ ...config, date_format: value })}
              >
                <SelectTrigger id="date_format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MMMM d, yyyy">January 15, 2025</SelectItem>
                  <SelectItem value="MMM d, yyyy">Jan 15, 2025</SelectItem>
                  <SelectItem value="dd/MM/yyyy">15/01/2025</SelectItem>
                  <SelectItem value="yyyy-MM-dd">2025-01-15</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show reading time</Label>
                <p className="text-sm text-muted-foreground">
                  Display estimated reading time on posts
                </p>
              </div>
              <Switch
                checked={config.show_reading_time}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, show_reading_time: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show author</Label>
                <p className="text-sm text-muted-foreground">
                  Display author name on posts
                </p>
              </div>
              <Switch
                checked={config.show_author}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, show_author: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show categories</Label>
                <p className="text-sm text-muted-foreground">
                  Display category badges on posts
                </p>
              </div>
              <Switch
                checked={config.show_categories}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, show_categories: checked })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Default Cover Image */}
      <Card>
        <CardHeader>
          <CardTitle>Default Cover Image</CardTitle>
          <CardDescription>
            Fallback image when posts don't have a cover image.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="default_cover">Image URL</Label>
            <Input
              id="default_cover"
              placeholder="https://example.com/default-cover.jpg"
              value={config.default_cover_image}
              onChange={(e) =>
                setConfig({ ...config, default_cover_image: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Future Features */}
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Features planned for future releases.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable comments</Label>
              <p className="text-sm text-muted-foreground">
                Allow readers to comment on posts
              </p>
            </div>
            <Switch
              checked={config.enable_comments}
              disabled
              onCheckedChange={(checked) =>
                setConfig({ ...config, enable_comments: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateModule.isPending}>
          {updateModule.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default BlogModuleSettings;
