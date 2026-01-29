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
import FeaturedItemEditor from './FeaturedItemEditor';
import ChatSettingsEditor from './ChatSettingsEditor';
import ProjectShowcaseEditor from './ProjectShowcaseEditor';
import PortfolioSettingsEditor from './PortfolioSettingsEditor';
import QuickActionsEditor from './QuickActionsEditor';
import { useUpdateAboutMeSettings } from '@/hooks/useAboutMeSettings';
import { useToast } from '@/hooks/use-toast';

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
  'hero': 'Hero',
  'about-split': 'About Me',
  'text-section': 'Text Section',
  'cta-banner': 'CTA Banner',
  'image-text': 'Image & Text',
  'spacer': 'Spacer',
  'featured-carousel': 'Featured Carousel',
  'expertise-grid': 'Expertise Grid',
  'project-showcase': 'Project Showcase',
  'chat-widget': 'Chat Widget',
  'video-hero': 'Video Hero ✨',
  'parallax-section': 'Parallax ✨',
  'bento-grid': 'Bento Grid ✨',
  'marquee': 'Marquee ✨',
  'stats-counter': 'Stats Counter ✨',
  'testimonial-carousel': 'Testimonials ✨',
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
  const { toast } = useToast();
  const updateAboutMe = useUpdateAboutMeSettings();
  
  // Merge pending changes with data
  const mergedHero = heroData ? { ...heroData, ...pendingHeroChanges } : null;
  const mergedAboutMe = aboutMeData ? { ...aboutMeData, ...pendingAboutMeChanges } : null;
  const mergedConfig = { ...block.block_config, ...pendingBlockChanges };

  // Direct save for image uploads (immediate feedback)
  const handleAboutMeImageUpload = async (url: string) => {
    try {
      // Extract path from URL for storage reference
      const imagePath = url ? url.split('/').pop() || undefined : undefined;
      await updateAboutMe.mutateAsync({ image_url: url, image_path: imagePath });
      toast({ title: 'Bild sparad', description: 'Profilbilden har uppdaterats.' });
    } catch (error) {
      toast({ title: 'Fel', description: 'Kunde inte spara bilden.', variant: 'destructive' });
    }
  };

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
          <Label>Name</Label>
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
            placeholder="Your tagline..."
            rows={3}
          />
        </div>
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <Label>Enable Animations</Label>
          <Switch
            checked={mergedHero?.enable_animations ?? true}
            onCheckedChange={(checked) => onHeroChange({ enable_animations: checked })}
          />
        </div>
        <div className="space-y-2">
          <Label>Animation Style</Label>
          <Select
            value={mergedHero?.animation_style || 'falling-stars'}
            onValueChange={(value) => onHeroChange({ animation_style: value })}
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
          features={getHeroFeatures()}
          onChange={handleFeaturesChange}
          maxItems={3}
        />
      </div>
    </div>
  );

  const renderAboutConfig = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
        <div className="space-y-2">
          <Label>Section Title</Label>
          <Input
            value={(mergedConfig.title as string) || ''}
            onChange={(e) => onBlockConfigChange({ title: e.target.value })}
            placeholder="About Me"
          />
        </div>
        <div className="space-y-2">
          <Label>Section Subtitle</Label>
          <Input
            value={(mergedConfig.subtitle as string) || ''}
            onChange={(e) => onBlockConfigChange({ subtitle: e.target.value })}
            placeholder="Get to know me better"
          />
        </div>
      </div>
      <div className="border-t pt-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={mergedAboutMe?.name || ''}
                onChange={(e) => onAboutMeChange({ name: e.target.value })}
              />
            </div>
            <ImageUpload
              label="Profile Image"
              value={mergedAboutMe?.image_url || ''}
              onChange={handleAboutMeImageUpload}
              bucket="about-me-images"
            />
            <div className="space-y-2">
              <Label>Introduction Text</Label>
              <Textarea
                value={mergedAboutMe?.intro_text || ''}
                onChange={(e) => onAboutMeChange({ intro_text: e.target.value })}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Additional Text</Label>
              <Textarea
                value={mergedAboutMe?.additional_text || ''}
                onChange={(e) => onAboutMeChange({ additional_text: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <div>
            <SkillListEditor
              label="Skills"
              skills={getAboutSkills()}
              onChange={handleSkillsChange}
              maxItems={3}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderTextSectionConfig = () => (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={(mergedConfig.title as string) || ''}
          onChange={(e) => onBlockConfigChange({ title: e.target.value })}
          className="text-lg"
        />
      </div>
      <div className="space-y-2">
        <Label>Content</Label>
        <Textarea
          value={(mergedConfig.content as string) || ''}
          onChange={(e) => onBlockConfigChange({ content: e.target.value })}
          rows={8}
        />
      </div>
      <div className="space-y-2">
        <Label>Alignment</Label>
        <Select
          value={(mergedConfig.alignment as string) || 'center'}
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
          value={(mergedConfig.title as string) || ''}
          onChange={(e) => onBlockConfigChange({ title: e.target.value })}
          className="text-xl font-semibold"
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={(mergedConfig.description as string) || ''}
          onChange={(e) => onBlockConfigChange({ description: e.target.value })}
          rows={3}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Button Text</Label>
          <Input
            value={(mergedConfig.button_text as string) || ''}
            onChange={(e) => onBlockConfigChange({ button_text: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Button URL</Label>
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
          label="Image"
          value={(mergedConfig.image_url as string) || ''}
          onChange={(url) => onBlockConfigChange({ image_url: url })}
          bucket="about-me-images"
        />
        <div className="space-y-2">
          <Label>Image Position</Label>
          <Select
            value={(mergedConfig.image_position as string) || 'left'}
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
            value={(mergedConfig.title as string) || ''}
            onChange={(e) => onBlockConfigChange({ title: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Content</Label>
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
        <Label>Height</Label>
        <Select
          value={(mergedConfig.height as string) || 'md'}
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

  const renderReadOnlyConfig = (message: string) => (
    <div className="text-center py-8 text-muted-foreground">
      <p className="text-sm">{message}</p>
      <p className="text-xs mt-2">Managed via respective admin section</p>
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
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input
                  value={(mergedConfig.title as string) || ''}
                  onChange={(e) => onBlockConfigChange({ title: e.target.value })}
                  placeholder="Featured In..."
                />
              </div>
              <div className="space-y-2">
                <Label>Section Subtitle</Label>
                <Input
                  value={(mergedConfig.subtitle as string) || ''}
                  onChange={(e) => onBlockConfigChange({ subtitle: e.target.value })}
                  placeholder="Where I've been featured"
                />
              </div>
            </div>
            <div className="border-t pt-6">
              <FeaturedItemEditor />
            </div>
          </div>
        );
      case 'expertise-grid':
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input
                  value={(mergedConfig.title as string) || ''}
                  onChange={(e) => onBlockConfigChange({ title: e.target.value })}
                  placeholder="Areas of Expertise"
                />
              </div>
              <div className="space-y-2">
                <Label>Section Subtitle</Label>
                <Input
                  value={(mergedConfig.subtitle as string) || ''}
                  onChange={(e) => onBlockConfigChange({ subtitle: e.target.value })}
                  placeholder="What I specialize in"
                />
              </div>
            </div>
            <div className="border-t pt-6">
              <ExpertiseAreaEditor />
            </div>
          </div>
        );
      case 'project-showcase':
        return (
          <div className="space-y-8">
            <PortfolioSettingsEditor />
            <div className="border-t pt-6">
              <ProjectShowcaseEditor />
            </div>
          </div>
        );
      case 'chat-widget':
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input
                  value={(mergedConfig.title as string) || ''}
                  onChange={(e) => onBlockConfigChange({ title: e.target.value })}
                  placeholder="Chat with me"
                />
              </div>
              <div className="space-y-2">
                <Label>Section Subtitle</Label>
                <Input
                  value={(mergedConfig.subtitle as string) || ''}
                  onChange={(e) => onBlockConfigChange({ subtitle: e.target.value })}
                  placeholder="Ask me anything"
                />
              </div>
            </div>
            <div className="border-t pt-6">
              <ChatSettingsEditor />
            </div>
            <div className="border-t pt-6">
              <QuickActionsEditor />
            </div>
          </div>
        );
      case 'video-hero':
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Video URL</Label>
                  <Input
                    value={(mergedConfig.video_url as string) || ''}
                    onChange={(e) => onBlockConfigChange({ video_url: e.target.value })}
                    placeholder="https://..."
                  />
                  <p className="text-xs text-muted-foreground">Direct link to MP4 video file</p>
                </div>
                <div className="space-y-2">
                  <Label>Headline</Label>
                  <Input
                    value={(mergedConfig.headline as string) || ''}
                    onChange={(e) => onBlockConfigChange({ headline: e.target.value })}
                    placeholder="Create Something Extraordinary"
                    className="text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subheadline</Label>
                  <Textarea
                    value={(mergedConfig.subheadline as string) || ''}
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
                      value={(mergedConfig.cta_text as string) || ''}
                      onChange={(e) => onBlockConfigChange({ cta_text: e.target.value })}
                      placeholder="Get Started"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA URL</Label>
                    <Input
                      value={(mergedConfig.cta_url as string) || ''}
                      onChange={(e) => onBlockConfigChange({ cta_url: e.target.value })}
                      placeholder="/contact"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Text Alignment</Label>
                  <Select
                    value={(mergedConfig.text_alignment as string) || 'center'}
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
                  <Label>Overlay Opacity ({((mergedConfig.overlay_opacity as number) ?? 0.7) * 100}%)</Label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={(mergedConfig.overlay_opacity as number) ?? 0.7}
                    onChange={(e) => onBlockConfigChange({ overlay_opacity: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <Label>Show Video Controls</Label>
                  <Switch
                    checked={(mergedConfig.show_controls as boolean) !== false}
                    onCheckedChange={(checked) => onBlockConfigChange({ show_controls: checked })}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 'parallax-section':
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <ImageUpload
                  label="Background Image"
                  value={(mergedConfig.background_image as string) || ''}
                  onChange={(url) => onBlockConfigChange({ background_image: url })}
                  bucket="about-me-images"
                />
                <div className="space-y-2">
                  <Label>Headline</Label>
                  <Input
                    value={(mergedConfig.headline as string) || ''}
                    onChange={(e) => onBlockConfigChange({ headline: e.target.value })}
                    placeholder="Immersive Experiences"
                    className="text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={(mergedConfig.description as string) || ''}
                    onChange={(e) => onBlockConfigChange({ description: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Section Height</Label>
                  <Select
                    value={(mergedConfig.height as string) || 'large'}
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
                  <Label>Parallax Speed ({(mergedConfig.parallax_speed as number) ?? 0.5})</Label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={(mergedConfig.parallax_speed as number) ?? 0.5}
                    onChange={(e) => onBlockConfigChange({ parallax_speed: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Text Color</Label>
                  <Select
                    value={(mergedConfig.text_color as string) || 'light'}
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
      case 'bento-grid':
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
              <div className="space-y-2">
                <Label>Section Headline</Label>
                <Input
                  value={(mergedConfig.headline as string) || ''}
                  onChange={(e) => onBlockConfigChange({ headline: e.target.value })}
                  placeholder="Everything You Need"
                />
              </div>
              <div className="space-y-2">
                <Label>Subheadline</Label>
                <Input
                  value={(mergedConfig.subheadline as string) || ''}
                  onChange={(e) => onBlockConfigChange({ subheadline: e.target.value })}
                  placeholder="A complete toolkit..."
                />
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Bento Grid uses default items. Custom item editing coming soon.
              </p>
            </div>
          </div>
        );
      case 'marquee':
        return (
          <div className="space-y-6">
            <div className="space-y-4 max-w-xl">
              <div className="space-y-2">
                <Label>Headline (optional)</Label>
                <Input
                  value={(mergedConfig.headline as string) || ''}
                  onChange={(e) => onBlockConfigChange({ headline: e.target.value })}
                  placeholder="TRUSTED BY INDUSTRY LEADERS"
                />
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Speed</Label>
                  <Select
                    value={(mergedConfig.speed as string) || 'medium'}
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
                    value={(mergedConfig.direction as string) || 'left'}
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
                  checked={(mergedConfig.pause_on_hover as boolean) !== false}
                  onCheckedChange={(checked) => onBlockConfigChange({ pause_on_hover: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <Label>Show Gradient Edges</Label>
                <Switch
                  checked={(mergedConfig.show_gradient as boolean) !== false}
                  onCheckedChange={(checked) => onBlockConfigChange({ show_gradient: checked })}
                />
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Marquee uses default text items. Custom item editing coming soon.
              </p>
            </div>
          </div>
        );
      case 'stats-counter':
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
              <div className="space-y-2">
                <Label>Section Headline</Label>
                <Input
                  value={(mergedConfig.headline as string) || ''}
                  onChange={(e) => onBlockConfigChange({ headline: e.target.value })}
                  placeholder="Our Impact"
                />
              </div>
              <div className="space-y-2">
                <Label>Subheadline</Label>
                <Input
                  value={(mergedConfig.subheadline as string) || ''}
                  onChange={(e) => onBlockConfigChange({ subheadline: e.target.value })}
                  placeholder="Numbers that speak for themselves"
                />
              </div>
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>Layout</Label>
                <Select
                  value={(mergedConfig.layout as string) || 'grid'}
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
                  checked={(mergedConfig.animate as boolean) !== false}
                  onCheckedChange={(checked) => onBlockConfigChange({ animate: checked })}
                />
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Stats Counter uses default statistics. Custom stat editing coming soon.
              </p>
            </div>
          </div>
        );
      case 'testimonial-carousel':
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
              <div className="space-y-2">
                <Label>Section Headline</Label>
                <Input
                  value={(mergedConfig.headline as string) || ''}
                  onChange={(e) => onBlockConfigChange({ headline: e.target.value })}
                  placeholder="What People Say"
                />
              </div>
              <div className="space-y-2">
                <Label>Subheadline</Label>
                <Input
                  value={(mergedConfig.subheadline as string) || ''}
                  onChange={(e) => onBlockConfigChange({ subheadline: e.target.value })}
                  placeholder="Trusted by industry leaders..."
                />
              </div>
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <Label>Autoplay</Label>
                <Switch
                  checked={(mergedConfig.autoplay as boolean) !== false}
                  onCheckedChange={(checked) => onBlockConfigChange({ autoplay: checked })}
                />
              </div>
              <div className="space-y-2">
                <Label>Autoplay Interval (ms)</Label>
                <Input
                  type="number"
                  value={(mergedConfig.autoplay_interval as number) || 5000}
                  onChange={(e) => onBlockConfigChange({ autoplay_interval: parseInt(e.target.value) })}
                  min={2000}
                  max={10000}
                  step={500}
                />
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Testimonial Carousel uses default testimonials. Custom testimonial editing coming soon.
              </p>
            </div>
          </div>
        );
      default:
        return <p className="text-muted-foreground">Unknown block type</p>;
    }
  };

  return (
    <Card className="border-primary border-2 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-muted/30">
        <CardTitle className="text-lg font-medium">
          Editing: {blockTypeLabels[block.block_type]}
        </CardTitle>
        <Button onClick={onDone} size="sm" className="gap-2">
          <Check className="h-4 w-4" />
          Done
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        {renderConfigByType()}
      </CardContent>
    </Card>
  );
};

export default InlineBlockEditor;
