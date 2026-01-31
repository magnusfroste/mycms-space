// ============================================
// Block Config Panel
// Side panel for editing block configuration
// All data now stored in block_config JSONB
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
import type { PageBlock } from '@/types';
import type {
  HeroBlockConfig,
  AboutSplitBlockConfig,
} from '@/types/blockConfigs';
import FeatureListEditor, { FeatureItem } from './FeatureListEditor';
import SkillListEditor, { SkillItem } from './SkillListEditor';
import ImageUpload from './ImageUpload';
import ContactFormEditor from './ContactFormEditor';

interface BlockConfigPanelProps {
  block: PageBlock;
  pendingChanges?: Record<string, unknown>;
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
  'contact-form': 'Kontaktformulär',
};

const BlockConfigPanel: React.FC<BlockConfigPanelProps> = ({
  block,
  pendingChanges,
  onBlockConfigChange,
  onClose,
}) => {
  // Merge pending changes with block config
  const config = { ...block.block_config, ...pendingChanges };

  // Type-safe config getters
  const getHeroConfig = (): HeroBlockConfig => config as HeroBlockConfig;
  const getAboutConfig = (): AboutSplitBlockConfig => config as AboutSplitBlockConfig;

  // Handle hero feature changes
  const handleHeroFeaturesChange = (features: FeatureItem[]) => {
    onBlockConfigChange({ features });
  };

  // Handle about skills changes
  const handleAboutSkillsChange = (skills: SkillItem[]) => {
    onBlockConfigChange({ skills });
  };

  const renderHeroConfig = () => {
    const heroConfig = getHeroConfig();
    const features = heroConfig.features || [];
    
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Namn</Label>
          <Input
            value={heroConfig.name || ''}
            onChange={(e) => onBlockConfigChange({ name: e.target.value })}
            placeholder="Magnus Froste"
          />
        </div>
        <div className="space-y-2">
          <Label>Tagline</Label>
          <Textarea
            value={heroConfig.tagline || ''}
            onChange={(e) => onBlockConfigChange({ tagline: e.target.value })}
            placeholder="Din tagline..."
            rows={2}
          />
        </div>
        <Separator />
        <FeatureListEditor
          label="Features"
          features={features}
          onChange={handleHeroFeaturesChange}
          maxItems={3}
        />
        <Separator />
        <div className="space-y-2">
          <Label>Animationsstil</Label>
          <Select
            value={heroConfig.animation_style || 'falling-stars'}
            onValueChange={(value) => onBlockConfigChange({ animation_style: value })}
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
            checked={heroConfig.enable_animations ?? true}
            onCheckedChange={(checked) => onBlockConfigChange({ enable_animations: checked })}
          />
        </div>
      </div>
    );
  };

  const renderAboutConfig = () => {
    const aboutConfig = getAboutConfig();
    const skills = aboutConfig.skills || [];
    
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Namn</Label>
          <Input
            value={aboutConfig.name || ''}
            onChange={(e) => onBlockConfigChange({ name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Introduktionstext</Label>
          <Textarea
            value={aboutConfig.intro_text || ''}
            onChange={(e) => onBlockConfigChange({ intro_text: e.target.value })}
            rows={4}
          />
        </div>
        <div className="space-y-2">
          <Label>Ytterligare text</Label>
          <Textarea
            value={aboutConfig.additional_text || ''}
            onChange={(e) => onBlockConfigChange({ additional_text: e.target.value })}
            rows={4}
          />
        </div>
        <ImageUpload
          label="Profilbild"
          value={aboutConfig.image_url || ''}
          onChange={(url) => onBlockConfigChange({ image_url: url })}
          bucket="about-me-images"
        />
        <Separator />
        <SkillListEditor
          label="Kompetenser"
          skills={skills}
          onChange={handleAboutSkillsChange}
          maxItems={3}
        />
      </div>
    );
  };

  const renderTextSectionConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Titel</Label>
        <Input
          value={(config.title as string) || ''}
          onChange={(e) => onBlockConfigChange({ title: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Innehåll</Label>
        <Textarea
          value={(config.content as string) || ''}
          onChange={(e) => onBlockConfigChange({ content: e.target.value })}
          rows={6}
        />
      </div>
      <div className="space-y-2">
        <Label>Justering</Label>
        <Select
          value={(config.alignment as string) || 'center'}
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
          value={(config.title as string) || ''}
          onChange={(e) => onBlockConfigChange({ title: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Beskrivning</Label>
        <Textarea
          value={(config.description as string) || ''}
          onChange={(e) => onBlockConfigChange({ description: e.target.value })}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label>Knapptext</Label>
        <Input
          value={(config.button_text as string) || ''}
          onChange={(e) => onBlockConfigChange({ button_text: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Knapp-URL</Label>
        <Input
          value={(config.button_url as string) || ''}
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
          value={(config.title as string) || ''}
          onChange={(e) => onBlockConfigChange({ title: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Innehåll</Label>
        <Textarea
          value={(config.content as string) || ''}
          onChange={(e) => onBlockConfigChange({ content: e.target.value })}
          rows={4}
        />
      </div>
      <ImageUpload
        label="Bild"
        value={(config.image_url as string) || ''}
        onChange={(url) => onBlockConfigChange({ image_url: url })}
        bucket="about-me-images"
      />
      <div className="space-y-2">
        <Label>Bildposition</Label>
        <Select
          value={(config.image_position as string) || 'left'}
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
          value={(config.height as string) || 'md'}
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

  const renderContactFormConfig = () => (
    <ContactFormEditor
      config={config as { title?: string; subtitle?: string; showSubject?: boolean; buttonText?: string; successMessage?: string }}
      onChange={onBlockConfigChange}
    />
  );

  const renderInfoMessage = (message: string) => (
    <div className="text-center py-8 text-muted-foreground">
      <p className="text-sm">{message}</p>
      <p className="text-xs mt-2">Använd inline-redigering för fullständiga alternativ</p>
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
      case 'contact-form':
        return renderContactFormConfig();
      case 'featured-carousel':
        return renderInfoMessage('Featured items redigeras via inline-editorn');
      case 'expertise-grid':
        return renderInfoMessage('Expertområden redigeras via inline-editorn');
      case 'project-showcase':
        return renderInfoMessage('Projekt redigeras via inline-editorn');
      case 'chat-widget':
        return renderInfoMessage('Chatt-inställningar redigeras via inline-editorn');
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
