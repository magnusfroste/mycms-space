// ============================================
// Landing Page Editor - WYSIWYG Block Editing
// Inline editing with live preview and save
// ============================================

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Save, X, Eye, Pencil, Loader2 } from 'lucide-react';
import { usePageBlocks, useUpdatePageBlock } from '@/models/pageBlocks';
import { useHeroSettings, useUpdateHeroSettings } from '@/hooks/useHeroSettings';
import { useAboutMeSettings, useUpdateAboutMeSettings } from '@/hooks/useAboutMeSettings';
import type { PageBlock } from '@/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Import editable block versions
import EditableHeroBlock from './editable-blocks/EditableHeroBlock';
import EditableAboutSplitBlock from './editable-blocks/EditableAboutSplitBlock';
import EditableTextSectionBlock from './editable-blocks/EditableTextSectionBlock';
import EditableCtaBannerBlock from './editable-blocks/EditableCtaBannerBlock';
import EditableImageTextBlock from './editable-blocks/EditableImageTextBlock';

// Non-editable blocks (data managed elsewhere)
import ChatWidgetBlock from '@/components/blocks/ChatWidgetBlock';
import FeaturedCarouselBlock from '@/components/blocks/FeaturedCarouselBlock';
import ExpertiseGridBlock from '@/components/blocks/ExpertiseGridBlock';
import ProjectShowcaseBlock from '@/components/blocks/ProjectShowcaseBlock';
import SpacerBlock from '@/components/blocks/SpacerBlock';

interface LandingPageEditorProps {
  onClose: () => void;
}

interface PendingChanges {
  hero?: Record<string, unknown>;
  aboutMe?: Record<string, unknown>;
  blocks?: Record<string, Record<string, unknown>>;
}

const LandingPageEditor: React.FC<LandingPageEditorProps> = ({ onClose }) => {
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({});
  
  // Fetch blocks and data
  const { data: blocks = [] } = usePageBlocks('home');
  const { data: heroData } = useHeroSettings();
  const { data: aboutMeData } = useAboutMeSettings();
  
  // Mutations
  const updateHero = useUpdateHeroSettings();
  const updateAboutMe = useUpdateAboutMeSettings();
  const updateBlock = useUpdatePageBlock();

  const hasChanges = Object.keys(pendingChanges).length > 0 || 
    pendingChanges.hero || 
    pendingChanges.aboutMe ||
    (pendingChanges.blocks && Object.keys(pendingChanges.blocks).length > 0);

  // Track hero changes
  const handleHeroChange = (changes: Record<string, unknown>) => {
    setPendingChanges(prev => ({
      ...prev,
      hero: { ...(prev.hero || {}), ...changes }
    }));
  };

  // Track about me changes
  const handleAboutMeChange = (changes: Record<string, unknown>) => {
    setPendingChanges(prev => ({
      ...prev,
      aboutMe: { ...(prev.aboutMe || {}), ...changes }
    }));
  };

  // Track block config changes
  const handleBlockConfigChange = (blockId: string, config: Record<string, unknown>) => {
    setPendingChanges(prev => ({
      ...prev,
      blocks: {
        ...(prev.blocks || {}),
        [blockId]: config
      }
    }));
  };

  // Save all pending changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const promises: Promise<unknown>[] = [];

      // Save hero changes
      if (pendingChanges.hero && heroData) {
        promises.push(updateHero.mutateAsync(pendingChanges.hero));
      }

      // Save about me changes
      if (pendingChanges.aboutMe && aboutMeData) {
        promises.push(updateAboutMe.mutateAsync(pendingChanges.aboutMe));
      }

      // Save block config changes
      if (pendingChanges.blocks) {
        for (const [blockId, config] of Object.entries(pendingChanges.blocks)) {
          const block = blocks.find(b => b.id === blockId);
          if (block) {
            promises.push(updateBlock.mutateAsync({
              id: blockId,
              block_config: { ...block.block_config, ...config }
            }));
          }
        }
      }

      await Promise.all(promises);
      
      setPendingChanges({});
      toast({ 
        title: 'Publicerat!', 
        description: 'Dina ändringar är nu synliga på landningssidan.' 
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({ 
        title: 'Fel', 
        description: 'Kunde inte spara ändringar', 
        variant: 'destructive' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Render block based on type with edit capability
  const renderBlock = (block: PageBlock) => {
    if (!block.enabled) return null;

    const blockChanges = pendingChanges.blocks?.[block.id] || {};
    const mergedConfig = { ...block.block_config, ...blockChanges };

    switch (block.block_type) {
      case 'hero':
        return (
          <EditableHeroBlock
            key={block.id}
            config={mergedConfig}
            heroData={heroData}
            pendingChanges={pendingChanges.hero}
            isEditMode={isEditMode}
            onChange={handleHeroChange}
          />
        );
      
      case 'about-split':
        return (
          <EditableAboutSplitBlock
            key={block.id}
            config={mergedConfig}
            aboutMeData={aboutMeData}
            pendingChanges={pendingChanges.aboutMe}
            isEditMode={isEditMode}
            onChange={handleAboutMeChange}
          />
        );
      
      case 'text-section':
        return (
          <EditableTextSectionBlock
            key={block.id}
            blockId={block.id}
            config={mergedConfig}
            isEditMode={isEditMode}
            onChange={(config) => handleBlockConfigChange(block.id, config)}
          />
        );
      
      case 'cta-banner':
        return (
          <EditableCtaBannerBlock
            key={block.id}
            blockId={block.id}
            config={mergedConfig}
            isEditMode={isEditMode}
            onChange={(config) => handleBlockConfigChange(block.id, config)}
          />
        );
      
      case 'image-text':
        return (
          <EditableImageTextBlock
            key={block.id}
            blockId={block.id}
            config={mergedConfig}
            isEditMode={isEditMode}
            onChange={(config) => handleBlockConfigChange(block.id, config)}
          />
        );

      // Non-editable blocks - render as-is
      case 'chat-widget':
        return <ChatWidgetBlock key={block.id} config={mergedConfig} />;
      case 'featured-carousel':
        return <FeaturedCarouselBlock key={block.id} config={mergedConfig} />;
      case 'expertise-grid':
        return <ExpertiseGridBlock key={block.id} config={mergedConfig} />;
      case 'project-showcase':
        return <ProjectShowcaseBlock key={block.id} config={mergedConfig} />;
      case 'spacer':
        return <SpacerBlock key={block.id} config={mergedConfig} />;
      
      default:
        return (
          <div key={block.id} className="py-8 text-center text-muted-foreground">
            Unknown block type: {block.block_type}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-auto">
      {/* Editor Toolbar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Stäng
            </Button>
            <div className="h-6 w-px bg-border" />
            <span className="text-sm font-medium">Redigera landningssidan</span>
            {hasChanges && (
              <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded-full">
                Osparade ändringar
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Förhandsgranska
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4 mr-2" />
                  Redigera
                </>
              )}
            </Button>
            
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sparar...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Spara & Publicera
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Page Preview/Editor */}
      <div className={isEditMode ? 'ring-2 ring-primary/20 ring-inset' : ''}>
        <Header />
        <main className="flex-grow">
          {blocks
            .filter(b => b.enabled)
            .sort((a, b) => a.order_index - b.order_index)
            .map(renderBlock)}
        </main>
        <Footer />
      </div>

      {/* Edit Mode Indicator */}
      {isEditMode && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg text-sm font-medium">
          Redigeringsläge aktivt — klicka på text för att redigera
        </div>
      )}
    </div>
  );
};

export default LandingPageEditor;
