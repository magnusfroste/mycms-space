// ============================================
// AI Module Settings
// Global AI configuration using unified modules system
// ============================================

import React from 'react';
import { Bot, Webhook, Power, FileText, Newspaper, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAIModule, useUpdateAIModule } from '@/models/modules';
import { usePages } from '@/models/pages';
import { useBlogPosts } from '@/models/blog';
import type { AIModuleConfig } from '@/types/modules';
import { useToast } from '@/hooks/use-toast';

const AIModuleSettings: React.FC = () => {
  const { data: module, config, isLoading } = useAIModule();
  const updateModule = useUpdateAIModule();
  const { toast } = useToast();
  
  // Fetch pages and blog posts for selection
  const { data: pages = [] } = usePages();
  const { data: blogPosts = [] } = useBlogPosts();

  const handleToggle = (enabled: boolean) => {
    updateModule.mutate(
      { enabled },
      {
        onSuccess: () => toast({ title: 'Saved' }),
        onError: () => toast({ title: 'Error saving', variant: 'destructive' }),
      }
    );
  };

  const handleConfigUpdate = (updates: Partial<AIModuleConfig>) => {
    if (!config) return;
    updateModule.mutate(
      { module_config: { ...config, ...updates } },
      {
        onSuccess: () => toast({ title: 'Saved' }),
        onError: () => toast({ title: 'Error saving', variant: 'destructive' }),
      }
    );
  };

  const togglePageSlug = (slug: string) => {
    const current = config?.selected_page_slugs || [];
    const updated = current.includes(slug)
      ? current.filter((s) => s !== slug)
      : [...current, slug];
    handleConfigUpdate({ selected_page_slugs: updated });
  };

  const toggleBlogId = (id: string) => {
    const current = config?.selected_blog_ids || [];
    const updated = current.includes(id)
      ? current.filter((i) => i !== id)
      : [...current, id];
    handleConfigUpdate({ selected_blog_ids: updated });
  };

  const selectAllPages = () => {
    handleConfigUpdate({ selected_page_slugs: pages.map((p) => p.slug) });
  };

  const selectNonePages = () => {
    handleConfigUpdate({ selected_page_slugs: [] });
  };

  const selectAllBlogs = () => {
    const publishedPosts = blogPosts.filter((p) => p.status === 'published');
    handleConfigUpdate({ selected_blog_ids: publishedPosts.map((p) => p.id) });
  };

  const selectNoneBlogs = () => {
    handleConfigUpdate({ selected_blog_ids: [] });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const selectedPageSlugs = config?.selected_page_slugs || [];
  const selectedBlogIds = config?.selected_blog_ids || [];
  const publishedPosts = blogPosts.filter((p) => p.status === 'published');

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Bot className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">AI Module</h2>
          <p className="text-muted-foreground">
            Global settings for the AI chat
          </p>
        </div>
      </div>

      {/* Enable/Disable Module */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Power className="h-5 w-5" />
            Module Status
          </CardTitle>
          <CardDescription>
            Enable or disable the AI chat module globally
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enabled">Enabled</Label>
              <p className="text-sm text-muted-foreground">
                When disabled, the chat widget won't be shown on the page
              </p>
            </div>
            <Switch
              id="enabled"
              checked={module?.enabled ?? true}
              onCheckedChange={handleToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Webhook Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook
          </CardTitle>
          <CardDescription>
            Webhook URL for sending chat messages to n8n or other backend
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook_url">Webhook URL</Label>
            <Input
              id="webhook_url"
              type="url"
              value={config?.webhook_url || ''}
              onChange={(e) => handleConfigUpdate({ webhook_url: e.target.value })}
              placeholder="https://agent.froste.eu/webhook/magnet"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Input
              id="provider"
              value={config?.provider || 'n8n'}
              onChange={(e) => handleConfigUpdate({ provider: e.target.value as 'n8n' | 'custom' | 'lovable' })}
              placeholder="n8n"
            />
            <p className="text-xs text-muted-foreground">
              Optional: identify which backend is being used (n8n, custom, etc.)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Page Context */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Page Context
          </CardTitle>
          <CardDescription>
            Include content from selected pages in webhook requests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="include_page_context">Include page content</Label>
              <p className="text-sm text-muted-foreground">
                Send page block content to the AI for better responses
              </p>
            </div>
            <Switch
              id="include_page_context"
              checked={config?.include_page_context ?? false}
              onCheckedChange={(checked) => handleConfigUpdate({ include_page_context: checked })}
            />
          </div>

          {config?.include_page_context && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Select pages to include</Label>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllPages}
                    className="text-xs text-primary hover:underline"
                  >
                    Select all
                  </button>
                  <span className="text-xs text-muted-foreground">|</span>
                  <button
                    onClick={selectNonePages}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {pages.map((page) => (
                  <Badge
                    key={page.slug}
                    variant={selectedPageSlugs.includes(page.slug) ? 'default' : 'outline'}
                    className="cursor-pointer transition-colors"
                    onClick={() => togglePageSlug(page.slug)}
                  >
                    {selectedPageSlugs.includes(page.slug) && (
                      <Check className="h-3 w-3 mr-1" />
                    )}
                    {page.title}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedPageSlugs.length} of {pages.length} pages selected
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Blog Context */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5" />
            Blog Context
          </CardTitle>
          <CardDescription>
            Include content from selected blog posts in webhook requests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="include_blog_context">Include blog content</Label>
              <p className="text-sm text-muted-foreground">
                Send blog post content to the AI for better responses
              </p>
            </div>
            <Switch
              id="include_blog_context"
              checked={config?.include_blog_context ?? false}
              onCheckedChange={(checked) => handleConfigUpdate({ include_blog_context: checked })}
            />
          </div>

          {config?.include_blog_context && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Select blog posts to include</Label>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllBlogs}
                    className="text-xs text-primary hover:underline"
                  >
                    Select all published
                  </button>
                  <span className="text-xs text-muted-foreground">|</span>
                  <button
                    onClick={selectNoneBlogs}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
              {publishedPosts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No published blog posts yet. Publish some posts to include them as context.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  {publishedPosts.map((post) => (
                    <Badge
                      key={post.id}
                      variant={selectedBlogIds.includes(post.id) ? 'default' : 'outline'}
                      className="cursor-pointer transition-colors"
                      onClick={() => toggleBlogId(post.id)}
                    >
                      {selectedBlogIds.includes(post.id) && (
                        <Check className="h-3 w-3 mr-1" />
                      )}
                      {post.title}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {selectedBlogIds.length} of {publishedPosts.length} published posts selected
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-muted-foreground">Context Info</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            When context is enabled, the chat widget will send the selected page and blog content
            along with each message to the webhook. This allows your n8n AI agent to answer
            questions based on the actual content of your website.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIModuleSettings;
