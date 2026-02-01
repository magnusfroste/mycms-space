// ============================================
// Landing Page Manager
// Visual block management with inline editing
// ============================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { Plus, GripVertical, Pencil, Trash2, Eye, EyeOff, ExternalLink, Sparkles } from 'lucide-react';
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
import type { PageBlock, BlockType } from '@/types';
import BlockTypePicker, { BLOCK_TYPE_OPTIONS } from './block-editor/BlockTypePicker';
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

// Block renderers (visual preview)
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

// Inline editor
import { InlineBlockEditor } from './block-editor';
import PageBuilderChat from './PageBuilderChat';
import BlockLibraryPanel from './block-editor/BlockLibraryPanel';

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

interface VisualBlockItemProps {
  block: PageBlock;
  isEditing: boolean;
  pendingChanges: Record<string, unknown>;
  onBlockConfigChange: (config: Record<string, unknown>) => void;
  onStartEdit: () => void;
  onEndEdit: () => void;
  onToggleEnabled: () => void;
  onDelete: () => void;
}

const VisualBlockItem = ({
  block,
  isEditing,
  pendingChanges,
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

  // Render block preview
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
      default:
        return (
          <div className="py-8 text-center text-muted-foreground">
            Okänd blocktyp: {block.block_type}
          </div>
        );
    }
  };

  // If editing, show inline editor
  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style}>
        <InlineBlockEditor
          block={block}
          pendingChanges={pendingChanges}
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
      {/* Block Controls Header */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 z-20',
          'flex items-center justify-between',
          'bg-background/95 backdrop-blur border-b px-3 py-2',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          isDragging && 'opacity-100'
        )}
      >
        {/* Left: Drag Handle + Block Type */}
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

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={onToggleEnabled}
            title={block.enabled ? 'Hide block' : 'Show block'}
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
            <span className="ml-1 text-xs">Edit</span>
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

      {/* Block Content - Visual Preview */}
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

interface LandingPageManagerProps {
  pageSlug?: string;
}

const LandingPageManager = ({ pageSlug = 'home' }: LandingPageManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [deleteBlockId, setDeleteBlockId] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newBlockType, setNewBlockType] = useState<BlockType>('text-section');
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  
  // Fetch blocks for selected page
  const { data: blocks = [], isLoading } = usePageBlocks(pageSlug);

  // Mutations
  const createBlock = useCreatePageBlock();
  const updateBlock = useUpdatePageBlock();
  const deleteBlock = useDeletePageBlock();
  const reorderBlocks = useReorderPageBlocks();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sortedBlocks = [...blocks].sort((a, b) => a.order_index - b.order_index);

  // Handle drag end
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

    // Optimistic update
    queryClient.setQueryData(pageBlocksKeys.byPage(pageSlug), reordered);

    try {
      await reorderBlocks.mutateAsync(
        reordered.map((b) => ({ id: b.id, order_index: b.order_index }))
      );
      toast({ title: 'Order updated' });
    } catch {
      queryClient.invalidateQueries({ queryKey: pageBlocksKeys.byPage(pageSlug) });
      toast({ title: 'Error', description: 'Could not update order', variant: 'destructive' });
    }
  };

  // Toggle block visibility
  const handleToggleEnabled = async (block: PageBlock) => {
    try {
      await updateBlock.mutateAsync({ id: block.id, enabled: !block.enabled });
      toast({ title: block.enabled ? 'Block hidden' : 'Block visible' });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  // Delete block with undo capability
  const handleDelete = async () => {
    if (!deleteBlockId) return;
    
    // Find the block to save its data for potential undo
    const blockToDelete = blocks.find((b) => b.id === deleteBlockId);
    if (!blockToDelete) {
      setDeleteBlockId(null);
      return;
    }
    
    // Store block data for undo
    const deletedBlockData = { ...blockToDelete };
    
    try {
      await deleteBlock.mutateAsync(deleteBlockId);
      queryClient.invalidateQueries({ queryKey: pageBlocksKeys.byPage(pageSlug) });
      
      // Show toast with undo action
      toast({
        title: 'Block borttaget',
        description: `"${blockToDelete.block_type}" har tagits bort`,
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

  // Track changes
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

  const handleAddBlock = async () => {
    const maxOrder = blocks.reduce((max, b) => Math.max(max, b.order_index), -1);
    try {
      await createBlock.mutateAsync({
        page_slug: pageSlug,
        block_type: newBlockType,
        block_config: {},
        order_index: maxOrder + 1,
        enabled: true,
      });
      setIsAddDialogOpen(false);
      setNewBlockType('text-section');
      toast({ title: 'Block added' });
    } catch {
      toast({ title: 'Error adding block', variant: 'destructive' });
    }
  };

  // AI creates a block
  const handleAICreateBlock = async (blockType: string, config: Record<string, unknown>) => {
    const maxOrder = blocks.reduce((max, b) => Math.max(max, b.order_index), -1);
    try {
      await createBlock.mutateAsync({
        page_slug: pageSlug,
        block_type: blockType as BlockType,
        block_config: config,
        order_index: maxOrder + 1,
        enabled: true,
      });
      toast({ title: 'AI skapade ett block', description: `${blockType} har lagts till` });
    } catch {
      toast({ title: 'Kunde inte skapa block', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading blocks...</div>;
  }

  // Quick add from library panel
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
      setIsLibraryOpen(false); // Close panel after adding
      toast({ title: 'Block tillagt', description: `${blockTypeLabels[blockType] || blockType} har lagts till` });
    } catch {
      toast({ title: 'Kunde inte lägga till block', variant: 'destructive' });
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Resizable layout: Chat left, Canvas center, Library right (collapsible) */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        {/* AI Chat Panel - Left side */}
        <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
          <div className="h-full border-r border-border flex flex-col">
            <PageBuilderChat
              currentBlocks={sortedBlocks}
              onClose={() => {}}
              onCreateBlock={handleAICreateBlock}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Block Canvas - Center */}
        <ResizablePanel defaultSize={isLibraryOpen ? 50 : 75} minSize={35}>
          <div className="flex flex-col h-full overflow-hidden">
            {/* Canvas Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Block Canvas</span>
                <Badge variant="secondary" className="text-xs">
                  {sortedBlocks.length} block
                </Badge>
              </div>
              <Button variant="outline" size="sm" onClick={handlePreview}>
                <ExternalLink className="mr-1 h-3 w-3" />
                Preview
              </Button>
            </div>

            {/* Scrollable Block Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                          <Sparkles className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Inga block ännu</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Använd chatten eller klicka på knappen nedan för att lägga till block
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
                        pendingChanges={pendingChanges.blocks?.[block.id] || {}}
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

              {/* Add Block Button - Below last block */}
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
            </div>
          </div>
        </ResizablePanel>

        {/* Block Library Panel - Right side (collapsible) */}
        {isLibraryOpen && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
              <BlockLibraryPanel
                onAddBlock={handleQuickAddBlock}
                isAdding={createBlock.isPending}
                onClose={() => setIsLibraryOpen(false)}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteBlockId} onOpenChange={() => setDeleteBlockId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete block?</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide the block from the page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Block Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Block</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <BlockTypePicker value={newBlockType} onChange={setNewBlockType} />
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddBlock} disabled={createBlock.isPending}>
                <Plus className="mr-2 h-4 w-4" />
                Add Block
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPageManager;
