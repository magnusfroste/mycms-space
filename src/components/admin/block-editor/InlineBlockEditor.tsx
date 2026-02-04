// ============================================
// Inline Block Editor
// In-place content editing for blocks
// All data now stored in block_config JSONB
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
import type { PageBlock } from '@/types';
import type {
  HeroBlockConfig,
  AboutSplitBlockConfig,
  ExpertiseGridBlockConfig,
  FeaturedCarouselBlockConfig,
  ChatWidgetBlockConfig,
  ChatHeroBlockConfig,
  ProjectShowcaseBlockConfig,
  SkillsBarBlockConfig,
  ValuesBlockConfig,
} from '@/types/blockConfigs';
import FeatureListEditor, { FeatureItem } from './FeatureListEditor';
import ImageUpload from './ImageUpload';
import ExpertiseAreaEditor from './ExpertiseAreaEditor';
import FeaturedItemEditor from './FeaturedItemEditor';
import ChatWidgetEditor from './ChatWidgetEditor';
import ChatHeroEditor from './ChatHeroEditor';
import ProjectShowcaseEditor from './ProjectShowcaseEditor';
import BentoItemEditor from './BentoItemEditor';
import StatsItemEditor from './StatsItemEditor';
import TestimonialItemEditor from './TestimonialItemEditor';
import GitHubBlockEditor from './GitHubBlockEditor';
import SocialLinksEditor from './SocialLinksEditor';
import SkillsBarEditor from './SkillsBarEditor';
import ValuesEditor from './ValuesEditor';
import { useToast } from '@/hooks/use-toast';
import type { GitHubBlockConfig } from '@/types/github';

interface InlineBlockEditorProps {
  block: PageBlock;
  pendingChanges?: Record<string, unknown>;
  onBlockConfigChange: (config: Record<string, unknown>) => void;
  onDone: () => void;
}

const blockTypeLabels: Record<string, string> = {
  'hero': 'Hero',
  'chat-hero': 'Chat Hero ✨',
  'about-split': 'About Me',
  'text-section': 'Text Section',
  'cta-banner': 'CTA Banner',
  'image-text': 'Image & Text',
  'spacer': 'Spacer',
  'featured-carousel': 'Featured Carousel',
  'expertise-grid': 'Services Grid',
  'skills-bar': 'Skills Bar ✨',
  'values': 'Values ✨',
  'project-showcase': 'Project Showcase',
  'chat-widget': 'Chat Widget',
  'video-hero': 'Video Hero ✨',
  'parallax-section': 'Parallax ✨',
  'bento-grid': 'Bento Grid ✨',
  'marquee': 'Marquee ✨',
  'stats-counter': 'Stats Counter ✨',
  'testimonial-carousel': 'Testimonials ✨',
  'contact-form': 'Contact Form',
  'github': 'GitHub Repos ✨',
};

const InlineBlockEditor: React.FC<InlineBlockEditorProps> = ({
  block,
  pendingChanges,
  onBlockConfigChange,
  onDone,
}) => {
  const { toast } = useToast();
  
  // Merge pending changes with block config
  const config = { ...block.block_config, ...pendingChanges };

  // Type-safe config getters
  const getHeroConfig = (): HeroBlockConfig => config as HeroBlockConfig;
  const getAboutConfig = (): AboutSplitBlockConfig => config as AboutSplitBlockConfig;

  // Handle hero feature changes
  const handleHeroFeaturesChange = (features: FeatureItem[]) => {
    onBlockConfigChange({ features });
  };

  const renderHeroConfig = () => {
    const heroConfig = getHeroConfig();
    const features = heroConfig.features || [];
    
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={heroConfig.name || ''}
              onChange={(e) => onBlockConfigChange({ name: e.target.value })}
              placeholder="Magnus Froste"
              className="text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label>Tagline</Label>
            <Textarea
              value={heroConfig.tagline || ''}
              onChange={(e) => onBlockConfigChange({ tagline: e.target.value })}
              placeholder="Your tagline..."
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <Label>Enable Animations</Label>
            <Switch
              checked={heroConfig.enable_animations ?? true}
              onCheckedChange={(checked) => onBlockConfigChange({ enable_animations: checked })}
            />
          </div>
          <div className="space-y-2">
            <Label>Animation Style</Label>
            <Select
              value={heroConfig.animation_style || 'falling-stars'}
              onValueChange={(value) => onBlockConfigChange({ animation_style: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="falling-stars">Falling Stars</SelectItem>
                <SelectItem value="particles">Particles</SelectItem>
                <SelectItem value="gradient-shift">Gradient</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <FeatureListEditor
            label="Features"
            features={features}
            onChange={handleHeroFeaturesChange}
            maxItems={3}
          />
        </div>
      </div>
    );
  };

  const renderAboutConfig = () => {
    const aboutConfig = getAboutConfig();
    const socialLinks = aboutConfig.social_links || [];
    
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={aboutConfig.name || ''}
                onChange={(e) => onBlockConfigChange({ name: e.target.value })}
              />
            </div>
            <ImageUpload
              label="Profile Image"
              value={aboutConfig.image_url || ''}
              onChange={(url) => onBlockConfigChange({ image_url: url })}
              bucket="about-me-images"
            />
            <div className="space-y-2">
              <Label>Introduction Text</Label>
              <Textarea
                value={aboutConfig.intro_text || ''}
                onChange={(e) => onBlockConfigChange({ intro_text: e.target.value })}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Additional Text</Label>
              <Textarea
                value={aboutConfig.additional_text || ''}
                onChange={(e) => onBlockConfigChange({ additional_text: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <div>
            <SocialLinksEditor
              links={socialLinks}
              onChange={(links) => onBlockConfigChange({ social_links: links })}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderSkillsBarConfig = () => {
    const skillsConfig = config as SkillsBarBlockConfig;
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
          <div className="space-y-2">
            <Label>Section Title</Label>
            <Input
              value={skillsConfig.title || ''}
              onChange={(e) => onBlockConfigChange({ title: e.target.value })}
              placeholder="Skills & Technologies"
            />
          </div>
          <div className="space-y-2">
            <Label>Section Subtitle</Label>
            <Input
              value={skillsConfig.subtitle || ''}
              onChange={(e) => onBlockConfigChange({ subtitle: e.target.value })}
              placeholder="My technical expertise"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Layout</Label>
          <Select
            value={skillsConfig.layout || 'bars'}
            onValueChange={(value) => onBlockConfigChange({ layout: value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bars">Progress Bars</SelectItem>
              <SelectItem value="tags">Tags</SelectItem>
              <SelectItem value="compact">Compact List</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="border-t pt-6">
          <SkillsBarEditor
            config={skillsConfig}
            onChange={(newConfig) => onBlockConfigChange(newConfig as unknown as Record<string, unknown>)}
          />
        </div>
      </div>
    );
  };

  const renderValuesConfig = () => {
    const valuesConfig = config as ValuesBlockConfig;
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
          <div className="space-y-2">
            <Label>Section Title</Label>
            <Input
              value={valuesConfig.title || ''}
              onChange={(e) => onBlockConfigChange({ title: e.target.value })}
              placeholder="My Values"
            />
          </div>
          <div className="space-y-2">
            <Label>Section Subtitle</Label>
            <Input
              value={valuesConfig.subtitle || ''}
              onChange={(e) => onBlockConfigChange({ subtitle: e.target.value })}
              placeholder="What I believe in"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Layout</Label>
          <Select
            value={valuesConfig.layout || 'grid'}
            onValueChange={(value) => onBlockConfigChange({ layout: value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grid">Grid</SelectItem>
              <SelectItem value="list">List</SelectItem>
              <SelectItem value="cards">Cards</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="border-t pt-6">
          <ValuesEditor
            config={valuesConfig}
            onChange={(newConfig) => onBlockConfigChange(newConfig as unknown as Record<string, unknown>)}
          />
        </div>
      </div>
    );
  };

  const renderTextSectionConfig = () => (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={(config.title as string) || ''}
          onChange={(e) => onBlockConfigChange({ title: e.target.value })}
          className="text-lg"
        />
      </div>
      <div className="space-y-2">
        <Label>Content</Label>
        <Textarea
          value={(config.content as string) || ''}
          onChange={(e) => onBlockConfigChange({ content: e.target.value })}
          rows={8}
        />
      </div>
      <div className="space-y-2">
        <Label>Alignment</Label>
        <Select
          value={(config.alignment as string) || 'center'}
          onValueChange={(value) => onBlockConfigChange({ alignment: value })}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderCtaBannerConfig = () => (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={(config.title as string) || ''}
          onChange={(e) => onBlockConfigChange({ title: e.target.value })}
          className="text-xl font-semibold"
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={(config.description as string) || ''}
          onChange={(e) => onBlockConfigChange({ description: e.target.value })}
          rows={3}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Button Text</Label>
          <Input
            value={(config.button_text as string) || ''}
            onChange={(e) => onBlockConfigChange({ button_text: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Button URL</Label>
          <Input
            value={(config.button_url as string) || ''}
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
          label="Image"
          value={(config.image_url as string) || ''}
          onChange={(url) => onBlockConfigChange({ image_url: url })}
          bucket="about-me-images"
        />
        <div className="space-y-2">
          <Label>Image Position</Label>
          <Select
            value={(config.image_position as string) || 'left'}
            onValueChange={(value) => onBlockConfigChange({ image_position: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            value={(config.title as string) || ''}
            onChange={(e) => onBlockConfigChange({ title: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Content</Label>
          <Textarea
            value={(config.content as string) || ''}
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
        <Label>Height</Label>
        <Select
          value={(config.height as string) || 'md'}
          onValueChange={(value) => onBlockConfigChange({ height: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Small (2rem)</SelectItem>
            <SelectItem value="md">Medium (4rem)</SelectItem>
            <SelectItem value="lg">Large (6rem)</SelectItem>
            <SelectItem value="xl">Extra Large (8rem)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderFeaturedConfig = () => {
    const featuredConfig = config as FeaturedCarouselBlockConfig;
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
          <div className="space-y-2">
            <Label>Section Title</Label>
            <Input
              value={featuredConfig.title || ''}
              onChange={(e) => onBlockConfigChange({ title: e.target.value })}
              placeholder="Featured In..."
            />
          </div>
          <div className="space-y-2">
            <Label>Section Subtitle</Label>
            <Input
              value={featuredConfig.subtitle || ''}
              onChange={(e) => onBlockConfigChange({ subtitle: e.target.value })}
              placeholder="Where I've been featured"
            />
          </div>
        </div>
        <div className="border-t pt-6">
          <FeaturedItemEditor
            config={featuredConfig}
            onChange={(newConfig) => onBlockConfigChange(newConfig as unknown as Record<string, unknown>)}
          />
        </div>
      </div>
    );
  };

  const renderExpertiseConfig = () => {
    const expertiseConfig = config as ExpertiseGridBlockConfig;
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
          <div className="space-y-2">
            <Label>Section Title</Label>
            <Input
              value={expertiseConfig.title || ''}
              onChange={(e) => onBlockConfigChange({ title: e.target.value })}
              placeholder="Areas of Expertise"
            />
          </div>
          <div className="space-y-2">
            <Label>Section Subtitle</Label>
            <Input
              value={expertiseConfig.subtitle || ''}
              onChange={(e) => onBlockConfigChange({ subtitle: e.target.value })}
              placeholder="What I specialize in"
            />
          </div>
        </div>
        <div className="border-t pt-6">
          <ExpertiseAreaEditor
            config={expertiseConfig}
            onChange={(newConfig) => onBlockConfigChange(newConfig as unknown as Record<string, unknown>)}
          />
        </div>
      </div>
    );
  };

  const renderProjectShowcaseConfig = () => {
    const projectConfig = config as ProjectShowcaseBlockConfig;
    return (
      <div className="space-y-6">
        <ProjectShowcaseEditor
          config={projectConfig}
          onChange={(newConfig) => onBlockConfigChange(newConfig as unknown as Record<string, unknown>)}
          blockId={block.id}
        />
      </div>
    );
  };

  const renderChatWidgetConfig = () => {
    const chatConfig = config as ChatWidgetBlockConfig;
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
          <div className="space-y-2">
            <Label>Section Title</Label>
            <Input
              value={chatConfig.title || ''}
              onChange={(e) => onBlockConfigChange({ title: e.target.value })}
              placeholder="Chat with me"
            />
          </div>
          <div className="space-y-2">
            <Label>Section Subtitle</Label>
            <Input
              value={chatConfig.subtitle || ''}
              onChange={(e) => onBlockConfigChange({ subtitle: e.target.value })}
              placeholder="Ask me anything"
            />
          </div>
        </div>
        <div className="border-t pt-6">
          <ChatWidgetEditor
            config={chatConfig}
            onChange={(newConfig) => onBlockConfigChange(newConfig as unknown as Record<string, unknown>)}
          />
        </div>
      </div>
    );
  };

  const renderVideoHeroConfig = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Video URL</Label>
            <Input
              value={(config.video_url as string) || ''}
              onChange={(e) => onBlockConfigChange({ video_url: e.target.value })}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground">Direct link to MP4 video file</p>
          </div>
          <div className="space-y-2">
            <Label>Headline</Label>
            <Input
              value={(config.headline as string) || ''}
              onChange={(e) => onBlockConfigChange({ headline: e.target.value })}
              placeholder="Create Something Extraordinary"
              className="text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label>Subheadline</Label>
            <Textarea
              value={(config.subheadline as string) || ''}
              onChange={(e) => onBlockConfigChange({ subheadline: e.target.value })}
              placeholder="Your vision, realized..."
              rows={2}
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label>CTA Button Text</Label>
              <Input
                value={(config.cta_text as string) || ''}
                onChange={(e) => onBlockConfigChange({ cta_text: e.target.value })}
                placeholder="Get Started"
              />
            </div>
            <div className="space-y-2">
              <Label>CTA URL</Label>
              <Input
                value={(config.cta_url as string) || ''}
                onChange={(e) => onBlockConfigChange({ cta_url: e.target.value })}
                placeholder="/contact"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Text Alignment</Label>
            <Select
              value={(config.text_alignment as string) || 'center'}
              onValueChange={(value) => onBlockConfigChange({ text_alignment: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Overlay Opacity ({((config.overlay_opacity as number) ?? 0.7) * 100}%)</Label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={(config.overlay_opacity as number) ?? 0.7}
              onChange={(e) => onBlockConfigChange({ overlay_opacity: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <Label>Show Video Controls</Label>
            <Switch
              checked={(config.show_controls as boolean) !== false}
              onCheckedChange={(checked) => onBlockConfigChange({ show_controls: checked })}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderParallaxConfig = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <ImageUpload
            label="Background Image"
            value={(config.background_image as string) || ''}
            onChange={(url) => onBlockConfigChange({ background_image: url })}
            bucket="about-me-images"
          />
          <div className="space-y-2">
            <Label>Headline</Label>
            <Input
              value={(config.headline as string) || ''}
              onChange={(e) => onBlockConfigChange({ headline: e.target.value })}
              placeholder="Immersive Experiences"
              className="text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={(config.description as string) || ''}
              onChange={(e) => onBlockConfigChange({ description: e.target.value })}
              rows={3}
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Section Height</Label>
            <Select
              value={(config.height as string) || 'large'}
              onValueChange={(value) => onBlockConfigChange({ height: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="medium">Medium (60vh)</SelectItem>
                <SelectItem value="large">Large (80vh)</SelectItem>
                <SelectItem value="full">Full Screen</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Parallax Speed ({(config.parallax_speed as number) ?? 0.5})</Label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={(config.parallax_speed as number) ?? 0.5}
              onChange={(e) => onBlockConfigChange({ parallax_speed: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label>Text Color</Label>
            <Select
              value={(config.text_color as string) || 'light'}
              onValueChange={(value) => onBlockConfigChange({ text_color: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light (for dark backgrounds)</SelectItem>
                <SelectItem value="dark">Dark (for light backgrounds)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBentoGridConfig = () => {
    const bentoItems = (config.items as Array<{
      id: string;
      title: string;
      description: string;
      icon?: string;
      image_url?: string;
      size: 'small' | 'medium' | 'large';
      gradient?: string;
    }>) || [];
    
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
          <div className="space-y-2">
            <Label>Section Headline</Label>
            <Input
              value={(config.headline as string) || ''}
              onChange={(e) => onBlockConfigChange({ headline: e.target.value })}
              placeholder="Everything You Need"
            />
          </div>
          <div className="space-y-2">
            <Label>Subheadline</Label>
            <Input
              value={(config.subheadline as string) || ''}
              onChange={(e) => onBlockConfigChange({ subheadline: e.target.value })}
              placeholder="A complete toolkit..."
            />
          </div>
        </div>
        <div className="border-t pt-6">
          <BentoItemEditor
            items={bentoItems}
            onChange={(items) => onBlockConfigChange({ items })}
          />
        </div>
      </div>
    );
  };

  const renderMarqueeConfig = () => (
    <div className="space-y-6">
      <div className="space-y-4 max-w-xl">
        <div className="space-y-2">
          <Label>Headline (optional)</Label>
          <Input
            value={(config.headline as string) || ''}
            onChange={(e) => onBlockConfigChange({ headline: e.target.value })}
            placeholder="TRUSTED BY INDUSTRY LEADERS"
          />
        </div>
        <div className="grid gap-4 grid-cols-2">
          <div className="space-y-2">
            <Label>Speed</Label>
            <Select
              value={(config.speed as string) || 'medium'}
              onValueChange={(value) => onBlockConfigChange({ speed: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slow">Slow (40s)</SelectItem>
                <SelectItem value="medium">Medium (25s)</SelectItem>
                <SelectItem value="fast">Fast (15s)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Direction</Label>
            <Select
              value={(config.direction as string) || 'left'}
              onValueChange={(value) => onBlockConfigChange({ direction: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <Label>Pause on Hover</Label>
          <Switch
            checked={(config.pause_on_hover as boolean) !== false}
            onCheckedChange={(checked) => onBlockConfigChange({ pause_on_hover: checked })}
          />
        </div>
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <Label>Show Gradient Edges</Label>
          <Switch
            checked={(config.show_gradient as boolean) !== false}
            onCheckedChange={(checked) => onBlockConfigChange({ show_gradient: checked })}
          />
        </div>
      </div>
    </div>
  );

  const renderStatsCounterConfig = () => {
    const statsItems = (config.stats as Array<{
      id: string;
      value: number;
      suffix?: string;
      prefix?: string;
      label: string;
      description?: string;
    }>) || [];
    
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
          <div className="space-y-2">
            <Label>Section Headline</Label>
            <Input
              value={(config.headline as string) || ''}
              onChange={(e) => onBlockConfigChange({ headline: e.target.value })}
              placeholder="Our Impact"
            />
          </div>
          <div className="space-y-2">
            <Label>Subheadline</Label>
            <Input
              value={(config.subheadline as string) || ''}
              onChange={(e) => onBlockConfigChange({ subheadline: e.target.value })}
              placeholder="Numbers that speak for themselves"
            />
          </div>
        </div>
        <div className="grid gap-4 grid-cols-2">
          <div className="space-y-2">
            <Label>Layout</Label>
            <Select
              value={(config.layout as string) || 'grid'}
              onValueChange={(value) => onBlockConfigChange({ layout: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grid (2x2 on mobile)</SelectItem>
                <SelectItem value="inline">Inline Row</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <Label>Animate Numbers</Label>
            <Switch
              checked={(config.animate as boolean) !== false}
              onCheckedChange={(checked) => onBlockConfigChange({ animate: checked })}
            />
          </div>
        </div>
        <div className="border-t pt-6">
          <StatsItemEditor
            items={statsItems}
            onChange={(stats) => onBlockConfigChange({ stats })}
          />
        </div>
      </div>
    );
  };

  const renderTestimonialConfig = () => {
    const testimonialItems = (config.testimonials as Array<{
      id: string;
      quote: string;
      author: string;
      role: string;
      company?: string;
      avatar_url?: string;
      rating?: number;
    }>) || [];
    
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
          <div className="space-y-2">
            <Label>Section Headline</Label>
            <Input
              value={(config.headline as string) || ''}
              onChange={(e) => onBlockConfigChange({ headline: e.target.value })}
              placeholder="What People Say"
            />
          </div>
          <div className="space-y-2">
            <Label>Subheadline</Label>
            <Input
              value={(config.subheadline as string) || ''}
              onChange={(e) => onBlockConfigChange({ subheadline: e.target.value })}
              placeholder="Trusted by industry leaders..."
            />
          </div>
        </div>
        <div className="grid gap-4 grid-cols-2">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <Label>Autoplay</Label>
            <Switch
              checked={(config.autoplay as boolean) !== false}
              onCheckedChange={(checked) => onBlockConfigChange({ autoplay: checked })}
            />
          </div>
          <div className="space-y-2">
            <Label>Autoplay Interval (ms)</Label>
            <Input
              type="number"
              value={(config.autoplay_interval as number) || 5000}
              onChange={(e) => onBlockConfigChange({ autoplay_interval: parseInt(e.target.value) })}
              min={2000}
              max={15000}
              step={1000}
            />
          </div>
        </div>
        <div className="border-t pt-6">
          <TestimonialItemEditor
            items={testimonialItems}
            onChange={(testimonials) => onBlockConfigChange({ testimonials })}
          />
        </div>
      </div>
    );
  };

  const renderContactFormConfig = () => (
    <div className="max-w-2xl space-y-4">
      <div className="space-y-2">
        <Label>Form Title</Label>
        <Input
          value={(config.title as string) || ''}
          onChange={(e) => onBlockConfigChange({ title: e.target.value })}
          placeholder="Get in Touch"
        />
      </div>
      <div className="space-y-2">
        <Label>Subtitle</Label>
        <Input
          value={(config.subtitle as string) || ''}
          onChange={(e) => onBlockConfigChange({ subtitle: e.target.value })}
          placeholder="We'd love to hear from you"
        />
      </div>
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <Label>Show Subject Field</Label>
        <Switch
          checked={(config.showSubject as boolean) ?? true}
          onCheckedChange={(checked) => onBlockConfigChange({ showSubject: checked })}
        />
      </div>
      <div className="space-y-2">
        <Label>Button Text</Label>
        <Input
          value={(config.buttonText as string) || ''}
          onChange={(e) => onBlockConfigChange({ buttonText: e.target.value })}
          placeholder="Send Message"
        />
      </div>
      <div className="space-y-2">
        <Label>Success Message</Label>
        <Textarea
          value={(config.successMessage as string) || ''}
          onChange={(e) => onBlockConfigChange({ successMessage: e.target.value })}
          placeholder="Thanks for reaching out! We'll get back to you soon."
          rows={2}
        />
      </div>
    </div>
  );

  const renderConfigByType = () => {
    switch (block.block_type) {
      case 'hero':
        return renderHeroConfig();
      case 'chat-hero':
        return (
          <ChatHeroEditor
            config={config}
            onChange={onBlockConfigChange}
          />
        );
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
        return renderFeaturedConfig();
      case 'expertise-grid':
        return renderExpertiseConfig();
      case 'skills-bar':
        return renderSkillsBarConfig();
      case 'values':
        return renderValuesConfig();
      case 'project-showcase':
        return renderProjectShowcaseConfig();
      case 'chat-widget':
        return renderChatWidgetConfig();
      case 'video-hero':
        return renderVideoHeroConfig();
      case 'parallax-section':
        return renderParallaxConfig();
      case 'bento-grid':
        return renderBentoGridConfig();
      case 'marquee':
        return renderMarqueeConfig();
      case 'stats-counter':
        return renderStatsCounterConfig();
      case 'testimonial-carousel':
        return renderTestimonialConfig();
      case 'contact-form':
        return renderContactFormConfig();
      case 'github':
        return (
          <GitHubBlockEditor
            config={config as unknown as GitHubBlockConfig}
            onChange={(newConfig) => onBlockConfigChange(newConfig as unknown as Record<string, unknown>)}
          />
        );
      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Unknown block type: {block.block_type}</p>
          </div>
        );
    }
  };

  return (
    <Card className="border-2 border-primary/50 bg-card/95">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 px-4 bg-primary/5">
        <CardTitle className="text-base font-medium">
          Editing: {blockTypeLabels[block.block_type] || block.block_type}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onDone} className="h-8">
          <Check className="h-4 w-4 mr-1" />
          Done
        </Button>
      </CardHeader>
      <CardContent className="p-4">
        {renderConfigByType()}
      </CardContent>
    </Card>
  );
};

export default InlineBlockEditor;
