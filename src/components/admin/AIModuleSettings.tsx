// ============================================
// AI Module Settings
// Chat behavior and context configuration
// ============================================

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Bot, Power, FileText, Newspaper, Check, Plug, MessageSquare, Github, Database, Eye, Copy, ChevronDown } from 'lucide-react';
import PromptEnhancer from './PromptEnhancer';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAIModule, useUpdateAIModule } from '@/models/modules';
import { useAIChatContext } from '@/hooks/useAIChatContext';
import { usePages } from '@/models/pages';
import { useBlogPosts } from '@/models/blog';
import { useEnabledGitHubRepos } from '@/models/githubRepos';
import type { AIModuleConfig, AIIntegrationType } from '@/types/modules';
import { integrationsMeta, defaultIntegrations } from '@/types/modules';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'react-router-dom';

const AIModuleSettings: React.FC = () => {
  const { data: module, config, isLoading } = useAIModule();
  const updateModule = useUpdateAIModule();
  const { toast } = useToast();
  const [, setSearchParams] = useSearchParams();
  const [showPayloadPreview, setShowPayloadPreview] = useState(false);
  
  // Get context data for preview
  const { contextData, hasContext } = useAIChatContext();
  
  // Local state for system_prompt to avoid DB calls on every keystroke
  const [localPrompt, setLocalPrompt] = useState('');
  const [promptDirty, setPromptDirty] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Sync local state when config loads
  useEffect(() => {
    if (config?.system_prompt !== undefined && !promptDirty) {
      setLocalPrompt(config.system_prompt || '');
    }
  }, [config?.system_prompt, promptDirty]);
  
  // Debounced save for system_prompt (1.5s after last keystroke)
  const debouncedSavePrompt = useCallback((newPrompt: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      if (config) {
        updateModule.mutate(
          { module_config: { ...config, system_prompt: newPrompt } },
          {
            onSuccess: () => {
              setPromptDirty(false);
              toast({ title: 'Saved' });
            },
            onError: () => toast({ title: 'Error saving', variant: 'destructive' }),
          }
        );
      }
    }, 1500);
  }, [config, updateModule, toast]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
  
  // Handle local prompt changes
  const handlePromptChange = (newPrompt: string) => {
    setLocalPrompt(newPrompt);
    setPromptDirty(true);
    debouncedSavePrompt(newPrompt);
  };
  
  // Handle AI-enhanced prompt (save immediately)
  const handleEnhancedPrompt = (newPrompt: string) => {
    setLocalPrompt(newPrompt);
    setPromptDirty(false);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    handleConfigUpdate({ system_prompt: newPrompt });
  };
  
  // Fetch pages, blog posts, and GitHub repos for selection
  const { data: pages = [] } = usePages();
  const { data: blogPosts = [] } = useBlogPosts();
  const { data: githubRepos = [] } = useEnabledGitHubRepos();

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

  const toggleRepoId = (id: string) => {
    const current = config?.selected_repo_ids || [];
    const updated = current.includes(id)
      ? current.filter((i) => i !== id)
      : [...current, id];
    handleConfigUpdate({ selected_repo_ids: updated });
  };

  const selectAllRepos = () => {
    handleConfigUpdate({ selected_repo_ids: githubRepos.map((r) => r.id) });
  };

  const selectNoneRepos = () => {
    handleConfigUpdate({ selected_repo_ids: [] });
  };

  const goToIntegrations = () => {
    setSearchParams({ tab: 'integrations' });
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
  const selectedRepoIds = config?.selected_repo_ids || [];
  const publishedPosts = blogPosts.filter((p) => p.status === 'published');
  const activeIntegration = config?.active_integration || 'n8n';
  const availableIntegrations = integrationsMeta.filter((i) => i.available);
  const activeIntegrationMeta = integrationsMeta.find((i) => i.type === activeIntegration);

  // Build active context sources summary
  const activeContextSources = (() => {
    const sources: string[] = [];
    
    if (config?.include_github_context && selectedRepoIds.length > 0) {
      sources.push(`GitHub (${selectedRepoIds.length})`);
    } else if (config?.include_github_context && githubRepos.length > 0) {
      sources.push(`GitHub (${githubRepos.length})`);
    }
    
    if (config?.include_page_context && selectedPageSlugs.length > 0) {
      sources.push(`Pages (${selectedPageSlugs.length})`);
    } else if (config?.include_page_context && pages.length > 0) {
      sources.push(`Pages (${pages.length})`);
    }
    
    if (config?.include_blog_context && selectedBlogIds.length > 0) {
      sources.push(`Blog (${selectedBlogIds.length})`);
    } else if (config?.include_blog_context && publishedPosts.length > 0) {
      sources.push(`Blog (${publishedPosts.length})`);
    }
    
    return sources;
  })();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bot className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">AI Chat</h2>
            <p className="text-muted-foreground">
              Configure chat widget behavior and context
            </p>
          </div>
        </div>
        
        {/* Active Context Sources Badge */}
        {activeContextSources.length > 0 && (
          <Badge variant="secondary" className="gap-1.5 text-sm py-1.5 px-3">
            <Database className="h-4 w-4" />
            {activeContextSources.join(', ')}
          </Badge>
        )}
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

      {/* System Prompt - Personality & Behavior */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Persona & Instructions
          </CardTitle>
          <CardDescription>
            Define your AI's personality, tone, and conversational style
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="system_prompt">System Prompt</Label>
                {promptDirty && (
                  <span className="text-xs text-muted-foreground animate-pulse">
                    Saving...
                  </span>
                )}
              </div>
              <PromptEnhancer
                currentPrompt={localPrompt}
                onEnhanced={handleEnhancedPrompt}
              />
            </div>
            <Textarea
              id="system_prompt"
              value={localPrompt}
              onChange={(e) => handlePromptChange(e.target.value)}
              placeholder={`# Role
You are [Name], an AI assistant for [Your Website]...

# Personality
- Friendly and helpful
- Professional but approachable

# Conversational Style
- Keep responses concise
- Ask clarifying questions
- Be pedagogical with examples`}
              className="min-h-[200px] font-mono text-sm"
            />
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

      {/* GitHub Context */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Projects Context
          </CardTitle>
          <CardDescription>
            Include GitHub repository data for AI to discuss your projects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="include_github_context">Include GitHub repos</Label>
              <p className="text-sm text-muted-foreground">
                Send project names, descriptions, and enrichment data to the AI
              </p>
            </div>
            <Switch
              id="include_github_context"
              checked={config?.include_github_context ?? false}
              onCheckedChange={(checked) => handleConfigUpdate({ include_github_context: checked })}
            />
          </div>

          {config?.include_github_context && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Select repos to include</Label>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllRepos}
                    className="text-xs text-primary hover:underline"
                  >
                    Select all
                  </button>
                  <span className="text-xs text-muted-foreground">|</span>
                  <button
                    onClick={selectNoneRepos}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
              {githubRepos.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No GitHub repos enabled. Enable repos in Integrations → GitHub Repos first.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  {githubRepos.map((repo) => (
                    <Badge
                      key={repo.id}
                      variant={selectedRepoIds.includes(repo.id) ? 'default' : 'outline'}
                      className="cursor-pointer transition-colors"
                      onClick={() => toggleRepoId(repo.id)}
                    >
                      {selectedRepoIds.includes(repo.id) && (
                        <Check className="h-3 w-3 mr-1" />
                      )}
                      {repo.enriched_title || repo.name}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {selectedRepoIds.length} of {githubRepos.length} repos selected
              </p>
              
              <div className="rounded-lg bg-muted/50 p-3 mt-2">
                <p className="text-xs text-muted-foreground">
                  💡 The AI will receive project names, descriptions, problem statements, and "why it matters" content to provide informed answers about your work.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Context Payload Preview */}
      <Card>
        <CardHeader>
          <Collapsible open={showPayloadPreview} onOpenChange={setShowPayloadPreview}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Context Payload Preview
                </CardTitle>
                <ChevronDown className={`h-4 w-4 transition-transform ${showPayloadPreview ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CardDescription>
              See the JSON structure sent to your AI provider (useful for n8n setup)
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
