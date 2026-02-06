// ============================================
// Projects Module Settings
// Global project display configuration
// ============================================

import React from 'react';
import { FolderOpen, LayoutGrid, Power, Tags } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useProjectsModule, useUpdateProjectsModule } from '@/models/modules';
import type { ProjectsModuleConfig } from '@/types/modules';
import { toast } from 'sonner';

const layoutOptions = [
  { value: 'alternating', label: 'Alternating (left/right)' },
  { value: 'grid', label: 'Grid' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'masonry', label: 'Masonry' },
];

const ProjectsModuleSettings: React.FC = () => {
  const { data: module, config, isLoading } = useProjectsModule();
  const updateModule = useUpdateProjectsModule();

  const handleToggle = (enabled: boolean) => {
    updateModule.mutate(
      { enabled },
      {
        onSuccess: () => toast.success('Saved'),
        onError: () => toast.error('Error saving'),
      }
    );
  };

  const handleConfigUpdate = <K extends keyof ProjectsModuleConfig>(
    field: K,
    value: ProjectsModuleConfig[K]
  ) => {
    if (!config) return;
    updateModule.mutate(
      { module_config: { ...config, [field]: value } },
      {
        onSuccess: () => toast.success('Saved'),
        onError: () => toast.error('Error saving'),
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
        <FolderOpen className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Projects Module</h2>
          <p className="text-muted-foreground">
            Global settings for project display
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
            Enable or disable the projects module globally
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enabled">Enabled</Label>
              <p className="text-sm text-muted-foreground">
                When disabled, project sections won't be shown on the page
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

      {/* Layout Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            Display Settings
          </CardTitle>
          <CardDescription>
            Control how projects are displayed on the page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="layout_style">Layout Style</Label>
            <Select
              value={config?.layout_style || 'alternating'}
              onValueChange={(value) => handleConfigUpdate('layout_style', value as ProjectsModuleConfig['layout_style'])}
            >
              <SelectTrigger id="layout_style">
                <SelectValue placeholder="Select layout style" />
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

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="show_categories">Show Categories</Label>
              <p className="text-sm text-muted-foreground">
                Display category tags on project cards
              </p>
            </div>
            <Switch
              id="show_categories"
              checked={config?.show_categories ?? true}
              onCheckedChange={(checked) => handleConfigUpdate('show_categories', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="link_to_detail_pages">Link to Detail Pages</Label>
              <p className="text-sm text-muted-foreground">
                Make project cards clickable with their own detail page
              </p>
            </div>
            <Switch
              id="link_to_detail_pages"
              checked={config?.link_to_detail_pages ?? true}
              onCheckedChange={(checked) => handleConfigUpdate('link_to_detail_pages', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Category Management - now in block_config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Categories
          </CardTitle>
          <CardDescription>
            Categories are now managed directly in the Project Showcase block
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Edit a Project Showcase block to manage categories.
          </p>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-muted-foreground">Future Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Projects per page</li>
            <li>• Animation effects</li>
            <li>• Filter settings</li>
            <li>• Sorting options</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectsModuleSettings;
