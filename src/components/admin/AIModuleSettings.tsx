// ============================================
// AI Module Settings
// Global AI configuration with integration system
// ============================================

import React, { useState, useMemo } from 'react';
import { Bot, Webhook, Power, FileText, Newspaper, Check, Eye, Copy, Sparkles, Server, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAIModule, useUpdateAIModule } from '@/models/modules';
import { usePages } from '@/models/pages';
import { useBlogPosts } from '@/models/blog';
import { useAIChatContext } from '@/hooks/useAIChatContext';
import type { AIModuleConfig, AIIntegrationType, N8nIntegration, LovableIntegration, integrationsMeta, defaultIntegrations } from '@/types/modules';
import { useToast } from '@/hooks/use-toast';

// Integration icons
const integrationIcons: Record<AIIntegrationType, React.ReactNode> = {
  n8n: <Webhook className="h-4 w-4" />,
  lovable: <Sparkles className="h-4 w-4" />,
  openai: <Bot className="h-4 w-4" />,
  gemini: <Sparkles className="h-4 w-4" />,
  ollama: <Server className="h-4 w-4" />,
};

// Import integration metadata
import { integrationsMeta as integrationsMetaData, defaultIntegrations as defaultIntegrationsData } from '@/types/modules';

const AIModuleSettings: React.FC = () => {
  const { data: module, config, isLoading } = useAIModule();
  const updateModule = useUpdateAIModule();
  const { toast } = useToast();
  const [showPayloadPreview, setShowPayloadPreview] = useState(false);
  
  // Fetch pages and blog posts for selection
  const { data: pages = [] } = usePages();
  const { data: blogPosts = [] } = useBlogPosts();
  
  // Get context data for preview
  const { contextData, hasContext } = useAIChatContext();

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
    const newIntegration = defaultIntegrationsData[integrationType];
    handleConfigUpdate({
      active_integration: integrationType,
      integration: { ...newIntegration, enabled: true },
      // Also update legacy fields for backwards compatibility
      provider: integrationType === 'n8n' ? 'n8n' : integrationType === 'lovable' ? 'lovable' : 'custom',
    });
  };

  const handleIntegrationFieldUpdate = (field: string, value: string) => {
    if (!config?.integration) return;
    const updatedIntegration = { ...config.integration, [field]: value };
    handleConfigUpdate({
      integration: updatedIntegration,
      // Also sync webhook_url for n8n
      ...(field === 'webhook_url' ? { webhook_url: value } : {}),
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

  // Generate sample payload for preview
  const samplePayload = useMemo(() => {
    const payload: Record<string, unknown> = {
      message: "What services do you offer?",
      sessionId: "session_1234567890_abc123def",
    };

    if (hasContext && contextData) {
      payload.siteContext = contextData;
    }

    return payload;
  }, [hasContext, contextData]);

  const copyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(samplePayload, null, 2));
    toast({ title: 'Copied to clipboard' });
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
  const currentIntegration = config?.integration || defaultIntegrationsData.n8n;
  const availableIntegrations = integrationsMetaData.filter((i) => i.available);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Bot className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">AI Module</h2>
          <p className="text-muted-foreground">
            Configure AI chat integrations and context
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
            {integrationIcons[activeIntegration]}
            Integration
          </CardTitle>
          <CardDescription>
            Choose how to connect your AI backend
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
                    <div className="flex items-center gap-2">
                      {integrationIcons[integration.type]}
                      <div>
                        <span className="font-medium">{integration.name}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
                {integrationsMetaData.filter((i) => !i.available).map((integration) => (
                  <SelectItem key={integration.type} value={integration.type} disabled>
                    <div className="flex items-center gap-2 opacity-50">
                      {integrationIcons[integration.type]}
                      <span>{integration.name}</span>
                      <Badge variant="outline" className="text-xs ml-2">Coming soon</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Integration-specific fields */}
          {activeIntegration === 'n8n' && (
            <div className="space-y-4 pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Connect to an n8n workflow via webhook. Your n8n agent will receive messages and context.
              </p>
              <div className="space-y-2">
                <Label htmlFor="webhook_url">Webhook URL</Label>
                <Input
                  id="webhook_url"
                  type="url"
                  value={(currentIntegration as N8nIntegration).webhook_url || config?.webhook_url || ''}
                  onChange={(e) => handleIntegrationFieldUpdate('webhook_url', e.target.value)}
                  placeholder="https://your-n8n.example.com/webhook/ai-chat"
                />
              </div>
            </div>
          )}

          {activeIntegration === 'lovable' && (
            <div className="space-y-4 pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Use Lovable's built-in AI gateway. No API key needed - powered by Gemini/GPT models.
              </p>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Select 
                  value={(currentIntegration as LovableIntegration).model || 'google/gemini-2.5-flash'}
                  onValueChange={(v) => handleIntegrationFieldUpdate('model', v)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border z-50">
                    <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash (Fast)</SelectItem>
                    <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro (Powerful)</SelectItem>
                    <SelectItem value="openai/gpt-5-mini">GPT-5 Mini</SelectItem>
                    <SelectItem value="openai/gpt-5">GPT-5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
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
            Include content from selected pages in requests
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
            Include content from selected blog posts in requests
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

      {/* Payload Preview */}
      <Card>
        <CardHeader>
          <Collapsible open={showPayloadPreview} onOpenChange={setShowPayloadPreview}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Payload Preview
                </CardTitle>
                <ChevronDown className={`h-4 w-4 transition-transform ${showPayloadPreview ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CardDescription>
              See what data will be sent to the {activeIntegration === 'n8n' ? 'webhook' : 'AI'}
            </CardDescription>
            <CollapsibleContent>
              <CardContent className="pt-4">
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={copyPayload}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-xs font-mono max-h-96 overflow-y-auto">
                    {JSON.stringify(samplePayload, null, 2)}
                  </pre>
                </div>
                {hasContext && (
                  <p className="text-xs text-muted-foreground mt-2">
                    ✓ Site context includes {contextData?.pages.length || 0} page(s) with {contextData?.pages.reduce((sum, p) => sum + p.blocks.length, 0) || 0} block(s) and {contextData?.blogs.length || 0} blog post(s)
                  </p>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </CardHeader>
      </Card>
    </div>
  );
};

export default AIModuleSettings;