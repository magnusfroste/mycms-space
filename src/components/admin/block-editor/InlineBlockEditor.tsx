// ============================================
// Inline Block Editor
// In-place content editing for blocks
// Shows form fields where the block is, not in a drawer
// ============================================

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Check, X } from 'lucide-react';
import type { PageBlock, HeroSettings, AboutMeSettings } from '@/types';
import FeatureListEditor, { FeatureItem } from './FeatureListEditor';
import SkillListEditor, { SkillItem } from './SkillListEditor';
import ImageUpload from './ImageUpload';
import ExpertiseAreaEditor from './ExpertiseAreaEditor';

interface InlineBlockEditorProps {
  block: PageBlock;
  heroData?: HeroSettings | null;
  aboutMeData?: AboutMeSettings | null;
  pendingHeroChanges?: Record<string, unknown>;
  pendingAboutMeChanges?: Record<string, unknown>;
  pendingBlockChanges?: Record<string, unknown>;
  onHeroChange: (changes: Record<string, unknown>) => void;
  onAboutMeChange: (changes: Record<string, unknown>) => void;
  onBlockConfigChange: (config: Record<string, unknown>) => void;
  onDone: () => void;
}

const blockTypeLabels: Record<string, string> = {
  'hero': 'Hero Block',
  'about-split': 'Om Mig',
  'text-section': 'Textsektion',
  'cta-banner': 'CTA Banner',
  'image-text': 'Bild & Text',
  'spacer': 'Mellanrum',
  'featured-carousel': 'Featured Carousel',
  'expertise-grid': 'Expertis Grid',
  'project-showcase': 'Projekt Showcase',
  'chat-widget': 'Chatt Widget',
};

const InlineBlockEditor: React.FC<InlineBlockEditorProps> = ({
  block,
  heroData,
  aboutMeData,
  pendingHeroChanges,
  pendingAboutMeChanges,
  pendingBlockChanges,
  onHeroChange,
  onAboutMeChange,
  onBlockConfigChange,
  onDone,
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
    ].filter(f => f.text);
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

  // Handle feature changes
  const handleFeaturesChange = (features: FeatureItem[]) => {
    const changes: Record<string, string> = {};
    features.forEach((feature, index) => {
      const num = index + 1;
      changes[`feature${num}`] = feature.text;
      changes[`feature${num}_icon`] = feature.icon;
    });
    for (let i = features.length + 1; i <= 3; i++) {
      changes[`feature${i}`] = '';
      changes[`feature${i}_icon`] = '';
    }
    onHeroChange(changes);
  };

  // Handle skill changes
  const handleSkillsChange = (skills: SkillItem[]) => {
    const changes: Record<string, string> = {};
    skills.forEach((skill, index) => {
      const num = index + 1;
      changes[`skill${num}_title`] = skill.title;
      changes[`skill${num}_description`] = skill.description;
      changes[`skill${num}_icon`] = skill.icon;
    });
    for (let i = skills.length + 1; i <= 3; i++) {
      changes[`skill${i}_title`] = '';
      changes[`skill${i}_description`] = '';
      changes[`skill${i}_icon`] = '';
    }
    onAboutMeChange(changes);
  };

  const renderHeroConfig = () => (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Namn</Label>
          <Input
            value={mergedHero?.name || ''}
            onChange={(e) => onHeroChange({ name: e.target.value })}
            placeholder="Magnus Froste"
            className="text-lg"
          />
        </div>
        <div className="space-y-2">
          <Label>Tagline</Label>
          <Textarea
            value={mergedHero?.tagline || ''}
            onChange={(e) => onHeroChange({ tagline: e.target.value })}
            placeholder="Din tagline..."
            rows={3}
          />
        </div>
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <Label>Aktivera animationer</Label>
          <Switch
            checked={mergedHero?.enable_animations ?? true}
            onCheckedChange={(checked) => onHeroChange({ enable_animations: checked })}
          />
        </div>
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
      </div>
      <div>
        <FeatureListEditor
          label="Features"
          features={getHeroFeatures()}
          onChange={handleFeaturesChange}
          maxItems={3}
        />
      </div>
    </div>
  );

  const renderAboutConfig = () => (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Namn</Label>
          <Input
            value={mergedAboutMe?.name || ''}
            onChange={(e) => onAboutMeChange({ name: e.target.value })}
          />
        </div>
        <ImageUpload
          label="Profilbild"
          value={mergedAboutMe?.image_url || ''}
          onChange={(url) => onAboutMeChange({ image_url: url })}
          bucket="about-me-images"
        />
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
      </div>
      <div>
        <SkillListEditor
          label="Kompetenser"
          skills={getAboutSkills()}
          onChange={handleSkillsChange}
          maxItems={3}
        />
      </div>
    </div>
  );

  const renderTextSectionConfig = () => (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="space-y-2">
        <Label>Titel</Label>
        <Input
          value={(mergedConfig.title as string) || ''}
          onChange={(e) => onBlockConfigChange({ title: e.target.value })}
          className="text-lg"
        />
      </div>
      <div className="space-y-2">
        <Label>Innehåll</Label>
        <Textarea
          value={(mergedConfig.content as string) || ''}
          onChange={(e) => onBlockConfigChange({ content: e.target.value })}
          rows={8}
        />
      </div>
      <div className="space-y-2">
        <Label>Justering</Label>
        <Select
          value={(mergedConfig.alignment as string) || 'center'}
          onValueChange={(value) => onBlockConfigChange({ alignment: value })}
        >
          <SelectTrigger className="w-40">
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
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="space-y-2">
        <Label>Titel</Label>
        <Input
          value={(mergedConfig.title as string) || ''}
          onChange={(e) => onBlockConfigChange({ title: e.target.value })}
          className="text-xl font-semibold"
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
      <div className="grid gap-4 md:grid-cols-2">
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
    </div>
  );

  const renderImageTextConfig = () => (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <ImageUpload
          label="Bild"
          value={(mergedConfig.image_url as string) || ''}
          onChange={(url) => onBlockConfigChange({ image_url: url })}
          bucket="about-me-images"
        />
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
      </div>
    </div>
  );

  const renderSpacerConfig = () => (
    <div className="max-w-xs mx-auto space-y-4">
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
        return <ExpertiseAreaEditor />;
      case 'project-showcase':
        return renderReadOnlyConfig('Projekt hanteras via Project-sektionen');
      case 'chat-widget':
        return renderReadOnlyConfig('Chattwidget hanteras via Chat-sektionen');
      default:
        return <p className="text-muted-foreground">Okänd blocktyp</p>;
    }
  };

  return (
    <Card className="border-primary border-2 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-muted/30">
        <CardTitle className="text-lg font-medium">
          Redigerar: {blockTypeLabels[block.block_type]}
        </CardTitle>
        <Button onClick={onDone} size="sm" className="gap-2">
          <Check className="h-4 w-4" />
          Klar
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        {renderConfigByType()}
      </CardContent>
    </Card>
  );
};

export default InlineBlockEditor;
