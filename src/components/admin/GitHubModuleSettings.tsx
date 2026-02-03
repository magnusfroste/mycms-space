// ============================================
// GitHub Module Settings
// Global GitHub integration configuration
// ============================================

import React from 'react';
import { Github, Power, LayoutGrid, Clock, RefreshCw } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useModule, useUpdateModule } from '@/models/modules';
import type { GitHubModuleConfig } from '@/types/modules';
import { useToast } from '@/hooks/use-toast';

const layoutOptions = [
  { value: 'grid', label: 'Grid' },
  { value: 'list', label: 'List' },
  { value: 'compact', label: 'Compact' },
];

const sortOptions = [
  { value: 'pushed', label: 'Recently Updated' },
  { value: 'stars', label: 'Most Stars' },
  { value: 'created', label: 'Recently Created' },
];

const GitHubModuleSettings: React.FC = () => {
  const { data: module, isLoading } = useModule('github');
  const updateModule = useUpdateModule('github');
  const { toast } = useToast();

  const config = module?.module_config as GitHubModuleConfig | undefined;

  const handleToggle = (enabled: boolean) => {
    updateModule.mutate(
      { enabled },
      {
        onSuccess: () => toast({ title: 'Saved' }),
        onError: () => toast({ title: 'Error saving', variant: 'destructive' }),
      }
    );
  };

  const handleConfigUpdate = <K extends keyof GitHubModuleConfig>(
    field: K,
    value: GitHubModuleConfig[K]
  ) => {
    if (!config) return;
    updateModule.mutate(
      { module_config: { ...config, [field]: value } },
      {
        onSuccess: () => toast({ title: 'Saved' }),
        onError: () => toast({ title: 'Error saving', variant: 'destructive' }),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Github className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">GitHub Module</h2>
          <p className="text-muted-foreground">
            Global settings for GitHub integration
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
            Enable or disable the GitHub module globally
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enabled">Enabled</Label>
              <p className="text-sm text-muted-foreground">
                When disabled, GitHub blocks won't fetch data
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

      {/* Username & Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Account
          </CardTitle>
          <CardDescription>
            Default GitHub username for blocks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Default Username</Label>
            <Input
              id="username"
              value={config?.username || ''}
              onChange={(e) => handleConfigUpdate('username', e.target.value)}
              placeholder="magnusfroste"
            />
            <p className="text-xs text-muted-foreground">
              This username will be used as default for all GitHub blocks
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cache Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Cache Settings
          </CardTitle>
          <CardDescription>
            Control how often GitHub data is refreshed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="cache_duration">Cache Duration (minutes)</Label>
            <Input
              id="cache_duration"
              type="number"
              min={5}
              max={1440}
              value={config?.cache_duration_minutes || 60}
              onChange={(e) => handleConfigUpdate('cache_duration_minutes', parseInt(e.target.value) || 60)}
            />
            <p className="text-xs text-muted-foreground">
              How long to cache GitHub API responses (5-1440 minutes)
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto_sync">Auto Sync</Label>
              <p className="text-sm text-muted-foreground">
                Automatically refresh GitHub data periodically
              </p>
            </div>
            <Switch
              id="auto_sync"
              checked={config?.auto_sync ?? false}
              onCheckedChange={(checked) => handleConfigUpdate('auto_sync', checked)}
            />
          </div>

          {config?.auto_sync && (
            <div className="space-y-2">
              <Label htmlFor="sync_interval">Sync Interval (hours)</Label>
              <Input
                id="sync_interval"
                type="number"
                min={1}
                max={168}
                value={config?.sync_interval_hours || 24}
                onChange={(e) => handleConfigUpdate('sync_interval_hours', parseInt(e.target.value) || 24)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Default Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            Default Display Settings
          </CardTitle>
          <CardDescription>
            Default settings for new GitHub blocks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="default_layout">Default Layout</Label>
            <Select
              value={config?.default_layout || 'grid'}
              onValueChange={(value) => handleConfigUpdate('default_layout', value as GitHubModuleConfig['default_layout'])}
            >
              <SelectTrigger id="default_layout">
                <SelectValue placeholder="Select layout" />
              </SelectTrigger>
              <SelectContent>
                {layoutOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_sort">Default Sort</Label>
            <Select
              value={config?.default_sort_by || 'pushed'}
              onValueChange={(value) => handleConfigUpdate('default_sort_by', value as GitHubModuleConfig['default_sort_by'])}
            >
              <SelectTrigger id="default_sort">
                <SelectValue placeholder="Select sort order" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_repos">Default Max Repos</Label>
            <Input
              id="max_repos"
              type="number"
              min={1}
              max={50}
              value={config?.default_max_repos || 6}
              onChange={(e) => handleConfigUpdate('default_max_repos', parseInt(e.target.value) || 6)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="hide_forked">Hide Forked Repos</Label>
              <p className="text-sm text-muted-foreground">
                Don't show forked repositories
              </p>
            </div>
            <Switch
              id="hide_forked"
              checked={config?.hide_forked ?? true}
              onCheckedChange={(checked) => handleConfigUpdate('hide_forked', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="hide_archived">Hide Archived Repos</Label>
              <p className="text-sm text-muted-foreground">
                Don't show archived repositories
              </p>
            </div>
            <Switch
              id="hide_archived"
              checked={config?.hide_archived ?? true}
              onCheckedChange={(checked) => handleConfigUpdate('hide_archived', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Future Features */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-muted-foreground flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Future Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• GitHub Token for higher rate limits</li>
            <li>• Webhook sync on repository changes</li>
            <li>• Import repos to Project module</li>
            <li>• README parsing for AI knowledge</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default GitHubModuleSettings;
