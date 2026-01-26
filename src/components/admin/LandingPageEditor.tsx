// ============================================
// Landing Page Editor - Block-based WYSIWYG
// Webflow-style editing with config panel
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

// Block editor components
import { EditableBlockWrapper, BlockConfigPanel } from './block-editor';

// Block renderers (view mode)
import HeroBlock from '@/components/blocks/HeroBlock';
import AboutSplitBlock from '@/components/blocks/AboutSplitBlock';
import TextSectionBlock from '@/components/blocks/TextSectionBlock';
import CtaBannerBlock from '@/components/blocks/CtaBannerBlock';
import ImageTextBlock from '@/components/blocks/ImageTextBlock';
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
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({});
  
  // Fetch blocks and data
  const { data: blocks = [] } = usePageBlocks('home');
  const { data: heroData } = useHeroSettings();
  const { data: aboutMeData } = useAboutMeSettings();
  
  // Mutations
  const updateHero = useUpdateHeroSettings();
  const updateAboutMe = useUpdateAboutMeSettings();
  const updateBlock = useUpdatePageBlock();

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  const hasChanges = 
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
        [blockId]: { ...(prev.blocks?.[blockId] || {}), ...config }
      }
    }));
  };

  // Toggle block enabled state
  const handleToggleEnabled = async (block: PageBlock) => {
    try {
      await updateBlock.mutateAsync({
        id: block.id,
        enabled: !block.enabled
      });
      toast({ 
        title: block.enabled ? 'Block dolt' : 'Block synligt',
        description: `Blocket är nu ${block.enabled ? 'dolt' : 'synligt'} på sidan.`
      });
    } catch (error) {
      toast({ title: 'Fel', description: 'Kunde inte uppdatera block', variant: 'destructive' });
    }
  };

  // Delete block
  const handleDeleteBlock = async (blockId: string) => {
    // For now, just toggle enabled - actual delete would need confirmation
    const block = blocks.find(b => b.id === blockId);
    if (block) {
      handleToggleEnabled(block);
    }
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

  // Render block preview
  const renderBlockPreview = (block: PageBlock) => {
    const blockChanges = pendingChanges.blocks?.[block.id] || {};
    const mergedConfig = { ...block.block_config, ...blockChanges };

    switch (block.block_type) {
      case 'hero':
        return <HeroBlock config={mergedConfig} />;
      case 'about-split':
        return <AboutSplitBlock config={mergedConfig} />;
      case 'text-section':
        return <TextSectionBlock config={mergedConfig} />;
      case 'cta-banner':
        return <CtaBannerBlock config={mergedConfig} />;
      case 'image-text':
        return <ImageTextBlock config={mergedConfig} />;
      case 'chat-widget':
        return <ChatWidgetBlock config={mergedConfig} />;
      case 'featured-carousel':
        return <FeaturedCarouselBlock config={mergedConfig} />;
      case 'expertise-grid':
        return <ExpertiseGridBlock config={mergedConfig} />;
      case 'project-showcase':
        return <ProjectShowcaseBlock config={mergedConfig} />;
      case 'spacer':
        return <SpacerBlock config={mergedConfig} />;
      default:
        return (
          <div className="py-8 text-center text-muted-foreground">
            Okänd blocktyp: {block.block_type}
          </div>
        );
    }
  };

  const sortedBlocks = [...blocks].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="fixed inset-0 z-50 bg-background flex">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Editor Toolbar */}
        <div className="bg-background/95 backdrop-blur border-b z-10">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Stäng
              </Button>
              <div className="h-6 w-px bg-border" />
              <span className="text-sm font-medium">Block Editor</span>
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
                onClick={() => {
                  setIsPreviewMode(!isPreviewMode);
                  setSelectedBlockId(null);
                }}
              >
                {isPreviewMode ? (
                  <>
                    <Pencil className="h-4 w-4 mr-2" />
                    Redigera
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Förhandsgranska
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

        {/* Page Preview with Blocks */}
        <div className="flex-1 overflow-auto">
          <div className={isPreviewMode ? '' : 'pb-20'}>
            <Header />
            <main className="flex-grow">
              {isPreviewMode ? (
                // Preview mode - render blocks normally
                sortedBlocks
                  .filter(b => b.enabled)
                  .map(block => (
                    <div key={block.id}>
                      {renderBlockPreview(block)}
                    </div>
                  ))
              ) : (
                // Edit mode - wrap blocks with controls
                <div className="pt-12 space-y-4">
                  {sortedBlocks.map(block => (
                    <EditableBlockWrapper
                      key={block.id}
                      block={block}
                      isSelected={selectedBlockId === block.id}
                      onSelect={() => setSelectedBlockId(
                        selectedBlockId === block.id ? null : block.id
                      )}
                      onDelete={() => handleDeleteBlock(block.id)}
                      onToggleEnabled={() => handleToggleEnabled(block)}
                    >
                      {renderBlockPreview(block)}
                    </EditableBlockWrapper>
                  ))}
                </div>
              )}
            </main>
            <Footer />
          </div>
        </div>
      </div>

      {/* Config Panel - slides in when block selected */}
      {selectedBlock && !isPreviewMode && (
        <BlockConfigPanel
          block={selectedBlock}
          heroData={heroData}
          aboutMeData={aboutMeData}
          pendingHeroChanges={pendingChanges.hero}
          pendingAboutMeChanges={pendingChanges.aboutMe}
          pendingBlockChanges={pendingChanges.blocks?.[selectedBlock.id]}
          onHeroChange={handleHeroChange}
          onAboutMeChange={handleAboutMeChange}
          onBlockConfigChange={(config) => handleBlockConfigChange(selectedBlock.id, config)}
          onClose={() => setSelectedBlockId(null)}
        />
      )}

      {/* Edit Mode Hint */}
      {!isPreviewMode && !selectedBlock && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg text-sm font-medium">
          Klicka på "Redigera" på ett block för att redigera dess innehåll
        </div>
      )}
    </div>
  );
};

export default LandingPageEditor;
