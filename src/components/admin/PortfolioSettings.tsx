import { useState } from 'react';
import { usePortfolioSettings, useUpdatePortfolioSettings } from '@/hooks/usePortfolioSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useEffect } from 'react';

export const PortfolioSettings = () => {
  const { data: settings, isLoading } = usePortfolioSettings();
  const updateSettings = useUpdatePortfolioSettings();
  const [sectionTitle, setSectionTitle] = useState('');

  // Update local state when settings load
  useEffect(() => {
    if (settings) {
      setSectionTitle(settings.section_title);
    }
  }, [settings]);

  const handleSave = async () => {
    await updateSettings.mutateAsync({
      section_title: sectionTitle,
    });
  };

  const handleReset = () => {
    if (settings) {
      setSectionTitle(settings.section_title);
    }
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Portfolio Section Settings</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="section-title">Section Title</Label>
          <Input
            id="section-title"
            value={sectionTitle}
            onChange={(e) => setSectionTitle(e.target.value)}
            placeholder="My Portfolio - Proof of Concepts & AI Initiatives"
          />
          <p className="text-xs text-muted-foreground">
            This title appears above your project showcase
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleSave}
            disabled={updateSettings.isPending}
          >
            {updateSettings.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleReset}
            disabled={updateSettings.isPending}
          >
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
};
