// ============================================
// Block Canvas Component
// Reusable visual block editor canvas
// ============================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, GripVertical, Pencil, Trash2, Eye, EyeOff, ExternalLink, Sparkles, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
  usePageBlocks,
  useCreatePageBlock,
  useUpdatePageBlock,
  useDeletePageBlock,
  useReorderPageBlocks,
  pageBlocksKeys,
} from '@/models/pageBlocks';
import { useHeroSettings } from '@/hooks/useHeroSettings';
import { useAboutMeSettings } from '@/hooks/useAboutMeSettings';
import type { PageBlock, BlockType } from '@/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

// Block renderers
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
import VideoHeroBlock from '@/components/blocks/VideoHeroBlock';
import ParallaxSectionBlock from '@/components/blocks/ParallaxSectionBlock';
import BentoGridBlock from '@/components/blocks/BentoGridBlock';
import MarqueeBlock from '@/components/blocks/MarqueeBlock';
import StatsCounterBlock from '@/components/blocks/StatsCounterBlock';
import TestimonialCarouselBlock from '@/components/blocks/TestimonialCarouselBlock';
import ContactFormBlock from '@/components/blocks/ContactFormBlock';

// Inline editor
import { InlineBlockEditor } from './block-editor';
import BlockLibraryPanel from './block-editor/BlockLibraryPanel';

export const blockTypeLabels: Record<string, string> = {
  'hero': 'Hero',
  'about-split': 'Om mig',
  'text-section': 'Textsektion',
  'cta-banner': 'CTA Banner',
  'image-text': 'Bild & Text',
  'spacer': 'Spacer',
  'featured-carousel': 'Utvalda',
  'expertise-grid': 'Expertis',
  'project-showcase': 'Projekt',
  'chat-widget': 'Chat',
  'video-hero': 'Video Hero ✨',
  'parallax-section': 'Parallax ✨',
  'bento-grid': 'Bento Grid ✨',
  'marquee': 'Marquee ✨',
  'stats-counter': 'Statistik ✨',
  'testimonial-carousel': 'Testimonials ✨',
  'contact-form': 'Kontaktformulär',
};

interface VisualBlockItemProps {
  block: PageBlock;
  isEditing: boolean;
  heroData: any;
  aboutMeData: any;
  pendingChanges: Record<string, unknown>;
  onHeroChange: (changes: Record<string, unknown>) => void;
  onAboutMeChange: (changes: Record<string, unknown>) => void;
  onBlockConfigChange: (config: Record<string, unknown>) => void;
  onStartEdit: () => void;
  onEndEdit: () => void;
  onToggleEnabled: () => void;
  onDelete: () => void;
}

const VisualBlockItem = ({
  block,
  isEditing,
  heroData,
  aboutMeData,
  pendingChanges,
  onHeroChange,
  onAboutMeChange,
  onBlockConfigChange,
  onStartEdit,
  onEndEdit,
  onToggleEnabled,
  onDelete,
}: VisualBlockItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const renderBlockPreview = () => {
    const config = { ...block.block_config, ...pendingChanges };
    
    switch (block.block_type) {
      case 'hero':
        return <HeroBlock config={config} />;
      case 'about-split':
        return <AboutSplitBlock config={config} />;
      case 'text-section':
        return <TextSectionBlock config={config} />;
      case 'cta-banner':
        return <CtaBannerBlock config={config} />;
      case 'image-text':
        return <ImageTextBlock config={config} />;
      case 'chat-widget':
        return <ChatWidgetBlock config={config} />;
      case 'featured-carousel':
        return <FeaturedCarouselBlock config={config} />;
      case 'expertise-grid':
        return <ExpertiseGridBlock config={config} />;
      case 'project-showcase':
        return <ProjectShowcaseBlock config={config} />;
      case 'spacer':
        return <SpacerBlock config={config} />;
      case 'video-hero':
        return <VideoHeroBlock config={config} />;
      case 'parallax-section':
        return <ParallaxSectionBlock config={config} />;
      case 'bento-grid':
        return <BentoGridBlock config={config} />;
      case 'marquee':
        return <MarqueeBlock config={config} />;
      case 'stats-counter':
        return <StatsCounterBlock config={config} />;
      case 'testimonial-carousel':
        return <TestimonialCarouselBlock config={config} />;
      case 'contact-form':
        return <ContactFormBlock config={config} />;
      default:
        return (
          <div className="py-8 text-center text-muted-foreground">
            Okänd blocktyp: {block.block_type}
          </div>
        );
    }
  };

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style}>
        <InlineBlockEditor
          block={block}
          heroData={heroData}
          aboutMeData={aboutMeData}
          pendingHeroChanges={block.block_type === 'hero' ? pendingChanges : undefined}
          pendingAboutMeChanges={block.block_type === 'about-split' ? pendingChanges : undefined}
          pendingBlockChanges={pendingChanges}
          onHeroChange={onHeroChange}
          onAboutMeChange={onAboutMeChange}
          onBlockConfigChange={onBlockConfigChange}
          onDone={onEndEdit}
        />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group transition-all duration-200',
        'border-2 border-transparent rounded-lg overflow-hidden',
        'hover:border-primary/30',
        !block.enabled && 'opacity-40',
        isDragging && 'z-50 opacity-90 shadow-2xl scale-[1.01]'
      )}
    >
      <div
        className={cn(
          'absolute top-0 left-0 right-0 z-20',
          'flex items-center justify-between',
          'bg-background/95 backdrop-blur border-b px-3 py-2',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          isDragging && 'opacity-100'
        )}
      >
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <Badge variant="secondary" className="text-xs">
            {blockTypeLabels[block.block_type] || block.block_type}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={onToggleEnabled}
            title={block.enabled ? 'Dölj block' : 'Visa block'}
          >
            {block.enabled ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 bg-primary/10 hover:bg-primary/20"
            onClick={onStartEdit}
          >
            <Pencil className="h-4 w-4" />
            <span className="ml-1 text-xs">Redigera</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="pointer-events-none pt-0 group-hover:pt-10 transition-all duration-200">
        {renderBlockPreview()}
      </div>
    </div>
  );
};

interface PendingChanges {
  hero?: Record<string, unknown>;
  aboutMe?: Record<string, unknown>;
  blocks?: Record<string, Record<string, unknown>>;
}

interface BlockCanvasProps {
  pageSlug: string;
  showLibraryToggle?: boolean;
  headerTitle?: string;
  compact?: boolean;
}

export const BlockCanvas = ({ 
  pageSlug, 
  showLibraryToggle = true,
  headerTitle = 'Block Canvas',
  compact = false,
}: BlockCanvasProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [deleteBlockId, setDeleteBlockId] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({});
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  const { data: blocks = [], isLoading } = usePageBlocks(pageSlug);
  const { data: heroData } = useHeroSettings();
  const { data: aboutMeData } = useAboutMeSettings();

  const createBlock = useCreatePageBlock();
  const updateBlock = useUpdatePageBlock();
  const deleteBlock = useDeletePageBlock();
  const reorderBlocks = useReorderPageBlocks();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sortedBlocks = [...blocks].sort((a, b) => a.order_index - b.order_index);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedBlocks.findIndex((b) => b.id === active.id);
    const newIndex = sortedBlocks.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(sortedBlocks, oldIndex, newIndex).map((b, index) => ({
      ...b,
      order_index: index,
    }));

    queryClient.setQueryData(pageBlocksKeys.byPage(pageSlug), reordered);

    try {
      await reorderBlocks.mutateAsync(
        reordered.map((b) => ({ id: b.id, order_index: b.order_index }))
      );
      toast({ title: 'Ordning uppdaterad' });
    } catch {
      queryClient.invalidateQueries({ queryKey: pageBlocksKeys.byPage(pageSlug) });
      toast({ title: 'Fel', description: 'Kunde inte uppdatera ordning', variant: 'destructive' });
    }
  };

  const handleToggleEnabled = async (block: PageBlock) => {
    try {
      await updateBlock.mutateAsync({ id: block.id, enabled: !block.enabled });
      toast({ title: block.enabled ? 'Block dolt' : 'Block synligt' });
    } catch {
      toast({ title: 'Fel', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteBlockId) return;
    
    const blockToDelete = blocks.find((b) => b.id === deleteBlockId);
    if (!blockToDelete) {
      setDeleteBlockId(null);
      return;
    }
    
    const deletedBlockData = { ...blockToDelete };
    
    try {
      await deleteBlock.mutateAsync(deleteBlockId);
      queryClient.invalidateQueries({ queryKey: pageBlocksKeys.byPage(pageSlug) });
      
      toast({
        title: 'Block borttaget',
        description: `"${blockTypeLabels[blockToDelete.block_type] || blockToDelete.block_type}" har tagits bort`,
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await createBlock.mutateAsync({
                  page_slug: deletedBlockData.page_slug,
                  block_type: deletedBlockData.block_type,
                  block_config: deletedBlockData.block_config,
                  order_index: deletedBlockData.order_index,
                  enabled: deletedBlockData.enabled ?? true,
                });
                queryClient.invalidateQueries({ queryKey: pageBlocksKeys.byPage(pageSlug) });
                toast({ title: 'Block återställt!' });
              } catch {
                toast({ title: 'Kunde inte återställa block', variant: 'destructive' });
              }
            }}
          >
            Ångra
          </Button>
        ),
      });
    } catch {
      toast({ title: 'Kunde inte ta bort block', variant: 'destructive' });
    }
    setDeleteBlockId(null);
  };

  const handleHeroChange = (changes: Record<string, unknown>) => {
    setPendingChanges((prev) => ({
      ...prev,
      hero: { ...(prev.hero || {}), ...changes },
    }));
  };

  const handleAboutMeChange = (changes: Record<string, unknown>) => {
    setPendingChanges((prev) => ({
      ...prev,
      aboutMe: { ...(prev.aboutMe || {}), ...changes },
    }));
  };

  const handleBlockConfigChange = (blockId: string, config: Record<string, unknown>) => {
    setPendingChanges((prev) => ({
      ...prev,
      blocks: {
        ...(prev.blocks || {}),
        [blockId]: { ...(prev.blocks?.[blockId] || {}), ...config },
      },
    }));
  };

  const handlePreview = () => {
    window.open(pageSlug === 'home' ? '/' : `/${pageSlug}`, '_blank');
  };

  const handleQuickAddBlock = async (blockType: string) => {
    const maxOrder = blocks.reduce((max, b) => Math.max(max, b.order_index), -1);
    try {
      await createBlock.mutateAsync({
        page_slug: pageSlug,
        block_type: blockType as BlockType,
        block_config: {},
        order_index: maxOrder + 1,
        enabled: true,
      });
      setIsLibraryOpen(false);
      toast({ title: 'Block tillagt', description: `${blockTypeLabels[blockType] || blockType} har lagts till` });
    } catch {
      toast({ title: 'Kunde inte lägga till block', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Layers className="h-8 w-8 animate-pulse mr-2" />
        Laddar block...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Canvas Header */}
      <div className={cn(
        "flex justify-between items-center border-b border-border bg-muted/30",
        compact ? "px-3 py-2" : "px-4 py-3"
      )}>
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">{headerTitle}</span>
          <Badge variant="secondary" className="text-xs">
            {sortedBlocks.length} block
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={handlePreview}>
          <ExternalLink className="mr-1 h-3 w-3" />
          Förhandsgranska
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Block Canvas */}
        <div className={cn(
          "flex-1 overflow-y-auto space-y-3",
          compact ? "p-3" : "p-4"
        )}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedBlocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {sortedBlocks.length === 0 ? (
                  <Card className="p-12 text-center border-dashed border-2">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Layers className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Inga block ännu</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Klicka på knappen nedan för att lägga till block
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  sortedBlocks.map((block) => (
                    <VisualBlockItem
                      key={block.id}
                      block={block}
                      isEditing={editingBlockId === block.id}
                      heroData={heroData}
                      aboutMeData={aboutMeData}
                      pendingChanges={pendingChanges.blocks?.[block.id] || {}}
                      onHeroChange={handleHeroChange}
                      onAboutMeChange={handleAboutMeChange}
                      onBlockConfigChange={(config) => handleBlockConfigChange(block.id, config)}
                      onStartEdit={() => setEditingBlockId(block.id)}
                      onEndEdit={() => setEditingBlockId(null)}
                      onToggleEnabled={() => handleToggleEnabled(block)}
                      onDelete={() => setDeleteBlockId(block.id)}
                    />
                  ))
                )}
              </div>
            </SortableContext>
          </DndContext>

          {/* Add Block Button */}
          {showLibraryToggle && (
            <div className="flex justify-center pt-4">
              <Button
                variant={isLibraryOpen ? "secondary" : "outline"}
                size="lg"
                className="gap-2 border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-colors"
                onClick={() => setIsLibraryOpen(!isLibraryOpen)}
              >
                <Plus className="h-5 w-5" />
                <span>Lägg till block</span>
              </Button>
            </div>
          )}
        </div>

        {/* Block Library Panel (inline) */}
        {isLibraryOpen && (
          <div className="w-80 border-l border-border">
            <BlockLibraryPanel
              onAddBlock={handleQuickAddBlock}
              isAdding={createBlock.isPending}
              onClose={() => setIsLibraryOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteBlockId} onOpenChange={() => setDeleteBlockId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort block?</AlertDialogTitle>
            <AlertDialogDescription>
              Blocket tas bort från sidan. Du kan ångra direkt efter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Ta bort</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BlockCanvas;
