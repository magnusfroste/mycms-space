// ============================================
// Projects Module Settings
// Global project display configuration
// ============================================

import React from 'react';
import { FolderOpen, LayoutGrid, Power } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjectsModule, useUpdateProjectsModule } from '@/models/modules';
import type { ProjectsModuleConfig } from '@/types/modules';
import { useToast } from '@/hooks/use-toast';

const layoutOptions = [
  { value: 'alternating', label: 'Alternerande (vänster/höger)' },
  { value: 'grid', label: 'Rutnät' },
  { value: 'carousel', label: 'Karusell' },
  { value: 'masonry', label: 'Masonry' },
];

const ProjectsModuleSettings: React.FC = () => {
  const { data: module, config, isLoading } = useProjectsModule();
  const updateModule = useUpdateProjectsModule();
  const { toast } = useToast();

  const handleToggle = (enabled: boolean) => {
    updateModule.mutate(
      { enabled },
      {
        onSuccess: () => toast({ title: 'Sparad' }),
        onError: () => toast({ title: 'Fel vid sparning', variant: 'destructive' }),
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
        onSuccess: () => toast({ title: 'Sparad' }),
        onError: () => toast({ title: 'Fel vid sparning', variant: 'destructive' }),
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
          <h2 className="text-2xl font-bold">Projekt Modul</h2>
          <p className="text-muted-foreground">
            Globala inställningar för projektvisning
          </p>
        </div>
      </div>

      {/* Enable/Disable Module */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Power className="h-5 w-5" />
            Modulstatus
          </CardTitle>
          <CardDescription>
            Aktivera eller inaktivera projekt-modulen globalt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enabled">Aktiverad</Label>
              <p className="text-sm text-muted-foreground">
                När inaktiverad visas inte projektsektioner på sidan
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
            Visningsinställningar
          </CardTitle>
          <CardDescription>
            Styr hur projekt visas på sidan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="layout_style">Layoutstil</Label>
            <Select
              value={config?.layout_style || 'alternating'}
              onValueChange={(value) => handleConfigUpdate('layout_style', value as ProjectsModuleConfig['layout_style'])}
            >
              <SelectTrigger id="layout_style">
                <SelectValue placeholder="Välj layoutstil" />
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
              <Label htmlFor="show_categories">Visa kategorier</Label>
              <p className="text-sm text-muted-foreground">
                Visar kategori-taggar på projektkort
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
              <Label htmlFor="link_to_detail_pages">Länka till detaljsidor</Label>
              <p className="text-sm text-muted-foreground">
                Gör projektkort klickbara med egen detaljsida
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

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-muted-foreground">Framtida funktioner</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Projekt per sida</li>
            <li>• Animationseffekter</li>
            <li>• Filterinställningar</li>
            <li>• Sorteringsalternativ</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectsModuleSettings;
