import { useState, useEffect } from 'react';
import { usePortfolioSettings, useUpdatePortfolioSettings } from '@/hooks/usePortfolioSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';

export const PortfolioSettings = () => {
  const { data: settings, isLoading } = usePortfolioSettings();
  const updateSettings = useUpdatePortfolioSettings();
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionSubtitle, setSectionSubtitle] = useState('');
  const [sectionDescription, setSectionDescription] = useState('');
  const [showSection, setShowSection] = useState(true);

  // Update local state when settings load
  useEffect(() => {
    if (settings) {
      setSectionTitle(settings.section_title);
      setSectionSubtitle(settings.section_subtitle || '');
      setSectionDescription(settings.section_description || '');
      setShowSection(settings.show_section);
    }
  }, [settings]);

  const handleSave = async () => {
    await updateSettings.mutateAsync({
      section_title: sectionTitle.trim(),
      section_subtitle: sectionSubtitle.trim(),
      section_description: sectionDescription.trim(),
      show_section: showSection,
    });
  };

  const handleReset = () => {
    if (settings) {
      setSectionTitle(settings.section_title);
      setSectionSubtitle(settings.section_subtitle || '');
      setSectionDescription(settings.section_description || '');
      setShowSection(settings.show_section);
    }
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Portfolio Section Settings</h3>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="show-section"
            checked={showSection}
            onCheckedChange={setShowSection}
          />
          <Label htmlFor="show-section">Show Portfolio Section</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="section-title">Section Title</Label>
          <Input
            id="section-title"
            value={sectionTitle}
            onChange={(e) => setSectionTitle(e.target.value)}
            placeholder="My Portfolio - Proof of Concepts & AI Initiatives"
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">
            Main heading for the portfolio section
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="section-subtitle">Subtitle (Optional)</Label>
          <Input
            id="section-subtitle"
            value={sectionSubtitle}
            onChange={(e) => setSectionSubtitle(e.target.value)}
            placeholder="Explore my latest work and innovations"
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">
            Brief subtitle under the main heading
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="section-description">Description (Optional)</Label>
          <Textarea
            id="section-description"
            value={sectionDescription}
            onChange={(e) => setSectionDescription(e.target.value)}
            placeholder="A brief description of your portfolio and the projects showcased below..."
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            Introductory text for the portfolio section (max 500 characters)
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
