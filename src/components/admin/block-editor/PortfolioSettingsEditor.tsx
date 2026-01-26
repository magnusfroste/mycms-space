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
import { Separator } from '@/components/ui/separator';
import { usePortfolioSettings, useUpdatePortfolioSettings } from '@/models/portfolioSettings';
import CategoryManager from './CategoryManager';

const PortfolioSettingsEditor: React.FC = () => {
  const { data: settings, isLoading: settingsLoading } = usePortfolioSettings();
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
          <Label>Show Portfolio Section</Label>
          <Switch
            checked={settings?.show_section ?? true}
            onCheckedChange={(checked) => handleChange('show_section', checked)}
          />
        </div>

        <div className="space-y-2">
          <Label>Section Title</Label>
          <Input
            value={settings?.section_title || ''}
            onChange={(e) => handleChange('section_title', e.target.value)}
            placeholder="My Portfolio - Proof of Concepts & AI Initiatives"
            className="text-lg"
          />
        </div>

        <div className="space-y-2">
          <Label>Section Subtitle</Label>
          <Input
            value={settings?.section_subtitle || ''}
            onChange={(e) => handleChange('section_subtitle', e.target.value)}
            placeholder="Explore my latest experiences!"
          />
        </div>

        <div className="space-y-2">
          <Label>Section Description</Label>
          <Textarea
            value={settings?.section_description || ''}
            onChange={(e) => handleChange('section_description', e.target.value)}
            placeholder="Exponential AI development requires continuous learning..."
            rows={4}
          />
        </div>
      </div>

      <Separator />

      {/* Category Management */}
      <CategoryManager />
    </div>
  );
};

export default PortfolioSettingsEditor;
