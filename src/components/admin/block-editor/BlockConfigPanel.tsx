// ============================================
// Block Config Panel
// Side panel for editing block configuration
// ============================================

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { X } from 'lucide-react';
import type { PageBlock, HeroSettings, AboutMeSettings } from '@/types';
import FeatureListEditor, { FeatureItem } from './FeatureListEditor';
import SkillListEditor, { SkillItem } from './SkillListEditor';

interface BlockConfigPanelProps {
  block: PageBlock;
  heroData?: HeroSettings | null;
  aboutMeData?: AboutMeSettings | null;
  pendingHeroChanges?: Record<string, unknown>;
  pendingAboutMeChanges?: Record<string, unknown>;
  pendingBlockChanges?: Record<string, unknown>;
  onHeroChange: (changes: Record<string, unknown>) => void;
  onAboutMeChange: (changes: Record<string, unknown>) => void;
  onBlockConfigChange: (config: Record<string, unknown>) => void;
  onClose: () => void;
}

const blockTypeLabels: Record<string, string> = {
  'hero': 'Hero Block',
  'about-split': 'Om Mig Block',
  'text-section': 'Textsektion',
  'cta-banner': 'CTA Banner',
  'image-text': 'Bild & Text',
  'spacer': 'Mellanrum',
  'featured-carousel': 'Featured Carousel',
  'expertise-grid': 'Expertis Grid',
  'project-showcase': 'Projekt Showcase',
  'chat-widget': 'Chatt Widget',
};

const BlockConfigPanel: React.FC<BlockConfigPanelProps> = ({
  block,
  heroData,
  aboutMeData,
  pendingHeroChanges,
  pendingAboutMeChanges,
  pendingBlockChanges,
  onHeroChange,
  onAboutMeChange,
  onBlockConfigChange,
  onClose,
}) => {
  // Merge pending changes with data
  const mergedHero = heroData ? { ...heroData, ...pendingHeroChanges } : null;
  const mergedAboutMe = aboutMeData ? { ...aboutMeData, ...pendingAboutMeChanges } : null;
  const mergedConfig = { ...block.block_config, ...pendingBlockChanges };

  // Convert hero features to array format for editing
  const getHeroFeatures = (): FeatureItem[] => {
    if (!mergedHero) return [];
    return [
      { text: mergedHero.feature1 || '', icon: mergedHero.feature1_icon || 'Rocket' },
      { text: mergedHero.feature2 || '', icon: mergedHero.feature2_icon || 'BarChart' },
      { text: mergedHero.feature3 || '', icon: mergedHero.feature3_icon || 'Brain' },
    ].filter(f => f.text); // Filter out empty ones
  };

  // Convert about skills to array format
  const getAboutSkills = (): SkillItem[] => {
    if (!mergedAboutMe) return [];
    return [
      { 
        title: mergedAboutMe.skill1_title || '', 
        description: mergedAboutMe.skill1_description || '', 
        icon: mergedAboutMe.skill1_icon || 'Monitor' 
      },
      { 
        title: mergedAboutMe.skill2_title || '', 
        description: mergedAboutMe.skill2_description || '', 
        icon: mergedAboutMe.skill2_icon || 'Rocket' 
      },
      { 
        title: mergedAboutMe.skill3_title || '', 
        description: mergedAboutMe.skill3_description || '', 
        icon: mergedAboutMe.skill3_icon || 'Brain' 
      },
    ].filter(s => s.title);
  };

  // Handle feature changes - convert back to individual fields
  const handleFeaturesChange = (features: FeatureItem[]) => {
    const changes: Record<string, string> = {};
    features.forEach((feature, index) => {
      const num = index + 1;
      changes[`feature${num}`] = feature.text;
      changes[`feature${num}_icon`] = feature.icon;
    });
    // Clear remaining slots if fewer features
    for (let i = features.length + 1; i <= 3; i++) {
      changes[`feature${i}`] = '';
      changes[`feature${i}_icon`] = '';
    }
    onHeroChange(changes);
  };

  // Handle skill changes - convert back to individual fields
  const handleSkillsChange = (skills: SkillItem[]) => {
    const changes: Record<string, string> = {};
    skills.forEach((skill, index) => {
      const num = index + 1;
      changes[`skill${num}_title`] = skill.title;
      changes[`skill${num}_description`] = skill.description;
      changes[`skill${num}_icon`] = skill.icon;
    });
    // Clear remaining slots if fewer skills
    for (let i = skills.length + 1; i <= 3; i++) {
      changes[`skill${i}_title`] = '';
      changes[`skill${i}_description`] = '';
      changes[`skill${i}_icon`] = '';
    }
    onAboutMeChange(changes);
  };

  const renderHeroConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Namn</Label>
        <Input
          value={mergedHero?.name || ''}
          onChange={(e) => onHeroChange({ name: e.target.value })}
          placeholder="Magnus Froste"
        />
      </div>
      <div className="space-y-2">
        <Label>Tagline</Label>
        <Textarea
          value={mergedHero?.tagline || ''}
          onChange={(e) => onHeroChange({ tagline: e.target.value })}
          placeholder="Din tagline..."
          rows={2}
        />
      </div>
      <Separator />
      <FeatureListEditor
        label="Features"
        features={getHeroFeatures()}
        onChange={handleFeaturesChange}
        maxItems={3}
      />
      <Separator />
      <div className="space-y-2">
        <Label>Animationsstil</Label>
        <Select
          value={mergedHero?.animation_style || 'falling-stars'}
          onValueChange={(value) => onHeroChange({ animation_style: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="falling-stars">Fallande stjärnor</SelectItem>
            <SelectItem value="particles">Partiklar</SelectItem>
            <SelectItem value="gradient-shift">Gradient</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label>Aktivera animationer</Label>
        <Switch
          checked={mergedHero?.enable_animations ?? true}
          onCheckedChange={(checked) => onHeroChange({ enable_animations: checked })}
        />
      </div>
    </div>
  );

  const renderAboutConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Namn</Label>
        <Input
          value={mergedAboutMe?.name || ''}
          onChange={(e) => onAboutMeChange({ name: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Introduktionstext</Label>
        <Textarea
          value={mergedAboutMe?.intro_text || ''}
          onChange={(e) => onAboutMeChange({ intro_text: e.target.value })}
          rows={4}
        />
      </div>
      <div className="space-y-2">
        <Label>Ytterligare text</Label>
        <Textarea
          value={mergedAboutMe?.additional_text || ''}
          onChange={(e) => onAboutMeChange({ additional_text: e.target.value })}
          rows={4}
        />
      </div>
      <div className="space-y-2">
        <Label>Bild-URL</Label>
        <Input
          value={mergedAboutMe?.image_url || ''}
          onChange={(e) => onAboutMeChange({ image_url: e.target.value })}
          placeholder="https://..."
        />
      </div>
      <Separator />
      <SkillListEditor
        label="Kompetenser"
        skills={getAboutSkills()}
        onChange={handleSkillsChange}
        maxItems={3}
      />
    </div>
  );

  const renderTextSectionConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Titel</Label>
        <Input
          value={(mergedConfig.title as string) || ''}
          onChange={(e) => onBlockConfigChange({ title: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Innehåll</Label>
        <Textarea
          value={(mergedConfig.content as string) || ''}
          onChange={(e) => onBlockConfigChange({ content: e.target.value })}
          rows={6}
        />
      </div>
      <div className="space-y-2">
        <Label>Justering</Label>
        <Select
          value={(mergedConfig.alignment as string) || 'center'}
          onValueChange={(value) => onBlockConfigChange({ alignment: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Vänster</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Höger</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderCtaBannerConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Titel</Label>
        <Input
          value={(mergedConfig.title as string) || ''}
          onChange={(e) => onBlockConfigChange({ title: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Beskrivning</Label>
        <Textarea
          value={(mergedConfig.description as string) || ''}
          onChange={(e) => onBlockConfigChange({ description: e.target.value })}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label>Knapptext</Label>
        <Input
          value={(mergedConfig.button_text as string) || ''}
          onChange={(e) => onBlockConfigChange({ button_text: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Knapp-URL</Label>
        <Input
          value={(mergedConfig.button_url as string) || ''}
          onChange={(e) => onBlockConfigChange({ button_url: e.target.value })}
          placeholder="/contact"
        />
      </div>
    </div>
  );

  const renderImageTextConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Titel</Label>
        <Input
          value={(mergedConfig.title as string) || ''}
          onChange={(e) => onBlockConfigChange({ title: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Innehåll</Label>
        <Textarea
          value={(mergedConfig.content as string) || ''}
          onChange={(e) => onBlockConfigChange({ content: e.target.value })}
          rows={4}
        />
      </div>
      <div className="space-y-2">
        <Label>Bild-URL</Label>
        <Input
          value={(mergedConfig.image_url as string) || ''}
          onChange={(e) => onBlockConfigChange({ image_url: e.target.value })}
          placeholder="https://..."
        />
      </div>
      <div className="space-y-2">
        <Label>Bildposition</Label>
        <Select
          value={(mergedConfig.image_position as string) || 'left'}
          onValueChange={(value) => onBlockConfigChange({ image_position: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Vänster</SelectItem>
            <SelectItem value="right">Höger</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderSpacerConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Höjd</Label>
        <Select
          value={(mergedConfig.height as string) || 'md'}
          onValueChange={(value) => onBlockConfigChange({ height: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Liten (2rem)</SelectItem>
            <SelectItem value="md">Medium (4rem)</SelectItem>
            <SelectItem value="lg">Stor (6rem)</SelectItem>
            <SelectItem value="xl">Extra stor (8rem)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderReadOnlyConfig = (message: string) => (
    <div className="text-center py-8 text-muted-foreground">
      <p className="text-sm">{message}</p>
      <p className="text-xs mt-2">Redigeras via respektive admin-sektion</p>
    </div>
  );

  const renderConfigByType = () => {
    switch (block.block_type) {
      case 'hero':
        return renderHeroConfig();
      case 'about-split':
        return renderAboutConfig();
      case 'text-section':
        return renderTextSectionConfig();
      case 'cta-banner':
        return renderCtaBannerConfig();
      case 'image-text':
        return renderImageTextConfig();
      case 'spacer':
        return renderSpacerConfig();
      case 'featured-carousel':
        return renderReadOnlyConfig('Featured items hanteras via Featured-sektionen');
      case 'expertise-grid':
        return renderReadOnlyConfig('Expertområden hanteras via Expertise-sektionen');
      case 'project-showcase':
        return renderReadOnlyConfig('Projekt hanteras via Project-sektionen');
      case 'chat-widget':
        return renderReadOnlyConfig('Chattwidget hanteras via Chat-sektionen');
      default:
        return <p className="text-muted-foreground">Okänd blocktyp</p>;
    }
  };

  return (
    <div className="w-80 bg-background border-l flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">{blockTypeLabels[block.block_type]}</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {renderConfigByType()}
        </div>
      </ScrollArea>
    </div>
  );
};

export default BlockConfigPanel;
