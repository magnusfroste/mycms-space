import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHeroSettings, useUpdateHeroSettings } from '@/hooks/useHeroSettings';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Rocket, BarChart, Brain, Lightbulb, Building, 
  LineChart, Layers, Users, Code, Zap, Target 
} from "lucide-react";

const iconOptions = [
  { value: 'Rocket', label: 'Rocket', icon: Rocket },
  { value: 'BarChart', label: 'Bar Chart', icon: BarChart },
  { value: 'Brain', label: 'Brain', icon: Brain },
  { value: 'Lightbulb', label: 'Lightbulb', icon: Lightbulb },
  { value: 'Building', label: 'Building', icon: Building },
  { value: 'LineChart', label: 'Line Chart', icon: LineChart },
  { value: 'Layers', label: 'Layers', icon: Layers },
  { value: 'Users', label: 'Users', icon: Users },
  { value: 'Code', label: 'Code', icon: Code },
  { value: 'Zap', label: 'Zap', icon: Zap },
  { value: 'Target', label: 'Target', icon: Target },
];

const animationStyles = [
  { value: 'falling-stars', label: 'Falling Stars' },
  { value: 'particles', label: 'Floating Particles' },
  { value: 'gradient-shift', label: 'Gradient Shift' },
  { value: 'none', label: 'None' },
];

export const HeroSettings = () => {
  const { data: settings, isLoading } = useHeroSettings();
  const updateSettings = useUpdateHeroSettings();

  const [formData, setFormData] = useState({
    name: settings?.name || '',
    tagline: settings?.tagline || '',
    feature1: settings?.feature1 || '',
    feature1_icon: settings?.feature1_icon || 'Rocket',
    feature2: settings?.feature2 || '',
    feature2_icon: settings?.feature2_icon || 'BarChart',
    feature3: settings?.feature3 || '',
    feature3_icon: settings?.feature3_icon || 'Brain',
    enable_animations: settings?.enable_animations ?? true,
    animation_style: settings?.animation_style || 'falling-stars',
  });

  // Update form when settings load
  useState(() => {
    if (settings) {
      setFormData({
        name: settings.name,
        tagline: settings.tagline,
        feature1: settings.feature1,
        feature1_icon: settings.feature1_icon,
        feature2: settings.feature2,
        feature2_icon: settings.feature2_icon,
        feature3: settings.feature3,
        feature3_icon: settings.feature3_icon,
        enable_animations: settings.enable_animations,
        animation_style: settings.animation_style,
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateSettings.mutateAsync(formData);
      toast({
        title: 'Success',
        description: 'Hero settings updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update hero settings',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Magnus Froste"
          />
        </div>

        <div>
          <Label htmlFor="tagline">Tagline</Label>
          <Textarea
            id="tagline"
            value={formData.tagline}
            onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
            placeholder="Innovation Strategist & AI Integration Expert"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="feature1">Feature 1 Label</Label>
            <Input
              id="feature1"
              value={formData.feature1}
              onChange={(e) => setFormData({ ...formData, feature1: e.target.value })}
              placeholder="Innovation"
            />
          </div>
          <div>
            <Label htmlFor="feature1_icon">Feature 1 Icon</Label>
            <Select
              value={formData.feature1_icon}
              onValueChange={(value) => setFormData({ ...formData, feature1_icon: value })}
            >
              <SelectTrigger id="feature1_icon">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="feature2">Feature 2 Label</Label>
            <Input
              id="feature2"
              value={formData.feature2}
              onChange={(e) => setFormData({ ...formData, feature2: e.target.value })}
              placeholder="Strategy"
            />
          </div>
          <div>
            <Label htmlFor="feature2_icon">Feature 2 Icon</Label>
            <Select
              value={formData.feature2_icon}
              onValueChange={(value) => setFormData({ ...formData, feature2_icon: value })}
            >
              <SelectTrigger id="feature2_icon">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="feature3">Feature 3 Label</Label>
            <Input
              id="feature3"
              value={formData.feature3}
              onChange={(e) => setFormData({ ...formData, feature3: e.target.value })}
              placeholder="AI Integration"
            />
          </div>
          <div>
            <Label htmlFor="feature3_icon">Feature 3 Icon</Label>
            <Select
              value={formData.feature3_icon}
              onValueChange={(value) => setFormData({ ...formData, feature3_icon: value })}
            >
              <SelectTrigger id="feature3_icon">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="enable_animations">Enable Animations</Label>
          <Switch
            id="enable_animations"
            checked={formData.enable_animations}
            onCheckedChange={(checked) => setFormData({ ...formData, enable_animations: checked })}
          />
        </div>

        {formData.enable_animations && (
          <div>
            <Label htmlFor="animation_style">Animation Style</Label>
            <Select
              value={formData.animation_style}
              onValueChange={(value: any) => setFormData({ ...formData, animation_style: value })}
            >
              <SelectTrigger id="animation_style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {animationStyles.map((style) => (
                  <SelectItem key={style.value} value={style.value}>
                    {style.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Button type="submit" disabled={updateSettings.isPending}>
        {updateSettings.isPending ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  );
};
