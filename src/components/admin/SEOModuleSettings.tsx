// ============================================
// SEO Module Settings
// Admin UI for managing SEO configuration
// ============================================

import { useState, useEffect } from 'react';
import { useSEOModule } from '@/hooks/useSEOModule';
import { updateModule } from '@/data/modules';
import type { SEOModuleConfig } from '@/types/modules';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Globe, Share2, FileText, Search, BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const SEOModuleSettings = () => {
  const { data: seoModule, isLoading } = useSEOModule();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [config, setConfig] = useState<SEOModuleConfig>({
    site_title: '',
    title_template: '%s | Site',
    site_description: '',
    site_url: '',
    default_og_image: '',
    twitter_handle: '',
    linkedin_url: '',
    google_analytics_id: '',
  });

  useEffect(() => {
    if (seoModule?.module_config) {
      setConfig(seoModule.module_config);
    }
  }, [seoModule]);

  const updateMutation = useMutation({
    mutationFn: (newConfig: SEOModuleConfig) =>
      updateModule('seo', { module_config: newConfig }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module', 'seo'] });
      toast({ title: 'SEO settings saved' });
    },
    onError: (error) => {
      toast({
        title: 'Error saving settings',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(config, {
      onSuccess: () => toast({ title: 'SEO settings saved' }),
      onError: () => toast({ title: 'Error saving settings', variant: 'destructive' }),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SEO Settings</h1>
          <p className="text-muted-foreground">
            Configure global SEO and social sharing defaults
          </p>
        </div>
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Site Identity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Site Identity
            </CardTitle>
            <CardDescription>
              Basic information about your site for search engines
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="site_title">Site Title</Label>
              <Input
                id="site_title"
                value={config.site_title}
                onChange={(e) => setConfig({ ...config, site_title: e.target.value })}
                placeholder="Your Site Name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title_template">Title Template</Label>
              <Input
                id="title_template"
                value={config.title_template}
                onChange={(e) => setConfig({ ...config, title_template: e.target.value })}
                placeholder="%s | Site Name"
              />
              <p className="text-xs text-muted-foreground">
                Use %s where the page title should appear. Example: "About | Magnus Froste"
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="site_description">Site Description</Label>
              <Textarea
                id="site_description"
                value={config.site_description}
                onChange={(e) => setConfig({ ...config, site_description: e.target.value })}
                placeholder="A brief description of your site..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Shown in search results. Keep it under 160 characters.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="site_url">Site URL</Label>
              <Input
                id="site_url"
                value={config.site_url}
                onChange={(e) => setConfig({ ...config, site_url: e.target.value })}
                placeholder="https://www.example.com"
              />
              <p className="text-xs text-muted-foreground">
                Used for canonical URLs and sitemap generation
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Social Sharing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Social Sharing
            </CardTitle>
            <CardDescription>
              Default settings for Open Graph and Twitter Cards
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="default_og_image">Default OG Image</Label>
              <Input
                id="default_og_image"
                value={config.default_og_image}
                onChange={(e) => setConfig({ ...config, default_og_image: e.target.value })}
                placeholder="/og-image.png"
              />
              <p className="text-xs text-muted-foreground">
                Image shown when sharing pages without a specific image. Recommended: 1200x630px
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="twitter_handle">Twitter Handle</Label>
              <Input
                id="twitter_handle"
                value={config.twitter_handle}
                onChange={(e) => setConfig({ ...config, twitter_handle: e.target.value })}
                placeholder="@yourusername"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                value={config.linkedin_url}
                onChange={(e) => setConfig({ ...config, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
          </CardContent>
        </Card>

        {/* Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics
            </CardTitle>
            <CardDescription>
              Configure tracking and analytics integrations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="google_analytics_id">Google Analytics ID</Label>
              <Input
                id="google_analytics_id"
                value={config.google_analytics_id}
                onChange={(e) => setConfig({ ...config, google_analytics_id: e.target.value })}
                placeholder="G-XXXXXXXXXX"
              />
              <p className="text-xs text-muted-foreground">
                Your GA4 Measurement ID (starts with G-). Leave empty to disable.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* SEO Files Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              SEO Files
            </CardTitle>
            <CardDescription>
              Static files that help search engines and AI discover your site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">sitemap.xml</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Dynamic sitemap with all pages and blog posts
                </p>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline mt-2 inline-block"
                >
                  View Sitemap →
                </a>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">llms.txt</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  AIEO file for AI assistants like ChatGPT
                </p>
                <a
                  href="/llms.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline mt-2 inline-block"
                >
                  View llms.txt →
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SEOModuleSettings;
