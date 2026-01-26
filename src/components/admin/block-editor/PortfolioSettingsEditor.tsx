// ============================================
// Portfolio Settings Editor
// Inline editing for portfolio section (title, description, categories)
// ============================================

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { usePortfolioSettings, useUpdatePortfolioSettings } from '@/models/portfolioSettings';
import { useCategories } from '@/models/categories';

const PortfolioSettingsEditor: React.FC = () => {
  const { data: settings, isLoading: settingsLoading } = usePortfolioSettings();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const updateSettings = useUpdatePortfolioSettings();

  const handleChange = (field: string, value: string | boolean) => {
    if (!settings?.id) return;
    updateSettings.mutate({ id: settings.id, [field]: value });
  };

  if (settingsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Section Settings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <Label>Visa Portfolio-sektionen</Label>
          <Switch
            checked={settings?.show_section ?? true}
            onCheckedChange={(checked) => handleChange('show_section', checked)}
          />
        </div>

        <div className="space-y-2">
          <Label>Sektionens titel</Label>
          <Input
            value={settings?.section_title || ''}
            onChange={(e) => handleChange('section_title', e.target.value)}
            placeholder="My Portfolio - Proof of Concepts & AI Initiatives"
            className="text-lg"
          />
        </div>

        <div className="space-y-2">
          <Label>Undertitel</Label>
          <Input
            value={settings?.section_subtitle || ''}
            onChange={(e) => handleChange('section_subtitle', e.target.value)}
            placeholder="Explore my latest experiences!"
          />
        </div>

        <div className="space-y-2">
          <Label>Beskrivning</Label>
          <Textarea
            value={settings?.section_description || ''}
            onChange={(e) => handleChange('section_description', e.target.value)}
            placeholder="Exponential AI development requires continuous learning..."
            rows={4}
          />
        </div>
      </div>

      {/* Categories Preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-muted-foreground uppercase tracking-wide">
            Kategorier ({categories?.length || 0})
          </Label>
          <p className="text-xs text-muted-foreground">
            Hantera kategorier via databasen
          </p>
        </div>
        
        {categoriesLoading ? (
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="font-normal">
              All Projects
            </Badge>
            {categories?.map((category) => (
              <Badge 
                key={category.id} 
                variant="outline"
                className="font-normal"
              >
                {category.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioSettingsEditor;
