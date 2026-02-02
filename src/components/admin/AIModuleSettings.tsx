// ============================================
// AI Module Settings
// Chat behavior and context configuration
// ============================================

import React from 'react';
import { Bot, Power, FileText, Newspaper, Check, Plug, MessageSquare } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAIModule, useUpdateAIModule } from '@/models/modules';
import { usePages } from '@/models/pages';
import { useBlogPosts } from '@/models/blog';
import type { AIModuleConfig, AIIntegrationType } from '@/types/modules';
import { integrationsMeta, defaultIntegrations } from '@/types/modules';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AIModuleSettings: React.FC = () => {
  const { data: module, config, isLoading } = useAIModule();
  const updateModule = useUpdateAIModule();
  const { toast } = useToast();
  const [, setSearchParams] = useSearchParams();
  
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

  const handleIntegrationChange = (integrationType: AIIntegrationType) => {
    const newIntegration = defaultIntegrations[integrationType];
    handleConfigUpdate({
      active_integration: integrationType,
      integration: { ...newIntegration, enabled: true },
      provider: integrationType === 'n8n' ? 'n8n' : integrationType === 'lovable' ? 'lovable' : 'custom',
    });
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

  const goToIntegrations = () => {
    setSearchParams({ tab: 'integrations' });
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
  const activeIntegration = config?.active_integration || 'n8n';
  const availableIntegrations = integrationsMeta.filter((i) => i.available);
  const activeIntegrationMeta = integrationsMeta.find((i) => i.type === activeIntegration);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Bot className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">AI Chat</h2>
          <p className="text-muted-foreground">
            Configure chat widget behavior and context
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

      {/* Integration Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5" />
            Integration
          </CardTitle>
          <CardDescription>
            Choose which AI backend to use for chat
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="integration">Active Integration</Label>
            <Select value={activeIntegration} onValueChange={handleIntegrationChange}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select integration" />
              </SelectTrigger>
              <SelectContent className="bg-popover border z-50">
                {availableIntegrations.map((integration) => (
                  <SelectItem key={integration.type} value={integration.type}>
                    <span className="font-medium">{integration.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {activeIntegrationMeta && (
            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                {activeIntegrationMeta.description}
              </p>
              <Button variant="outline" size="sm" onClick={goToIntegrations}>
                Configure
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Prompt */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            System Prompt
          </CardTitle>
          <CardDescription>
            Instructions sent to all AI providers (n8n, OpenAI, Gemini, Lovable)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="system_prompt">AI Instructions</Label>
            <Textarea
              id="system_prompt"
              value={config?.system_prompt || ''}
              onChange={(e) => handleConfigUpdate({ system_prompt: e.target.value })}
              placeholder="You are a helpful AI assistant..."
              className="min-h-[120px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              This prompt is sent with every request to define the AI's personality and behavior.
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
            Include content from selected pages in AI requests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="include_page_context">Include page content</Label>
              <p className="text-sm text-muted-foreground">
                Send page block content (hero, about, etc.) to the AI
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
            Include content from selected blog posts in AI requests
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
    </div>
  );
};

export default AIModuleSettings;
