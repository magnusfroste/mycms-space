// ============================================
// Landing Page Manager
// Visual block management with inline editing
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
import { Plus, GripVertical, Pencil, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
  usePageBlocks,
  useUpdatePageBlock,
  useReorderPageBlocks,
  pageBlocksKeys,
} from '@/models/pageBlocks';
import { useHeroSettings } from '@/hooks/useHeroSettings';
import { useAboutMeSettings } from '@/hooks/useAboutMeSettings';
import type { PageBlock } from '@/types';
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

// Inline editor
import { InlineBlockEditor } from './block-editor';

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

const LandingPageManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [deleteBlockId, setDeleteBlockId] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({});

  // Fetch blocks for home page
  const { data: blocks = [], isLoading } = usePageBlocks('home');
  const { data: heroData } = useHeroSettings();
  const { data: aboutMeData } = useAboutMeSettings();

  // Mutations
  const updateBlock = useUpdatePageBlock();
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
    queryClient.setQueryData(pageBlocksKeys.byPage('home'), reordered);

    try {
      await reorderBlocks.mutateAsync(
        reordered.map((b) => ({ id: b.id, order_index: b.order_index }))
      );
      toast({ title: 'Order updated' });
    } catch {
      queryClient.invalidateQueries({ queryKey: pageBlocksKeys.byPage('home') });
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

  // Delete block
  const handleDelete = async () => {
    if (!deleteBlockId) return;
    const block = blocks.find((b) => b.id === deleteBlockId);
    if (block) {
      await updateBlock.mutateAsync({ id: block.id, enabled: false });
      toast({ title: 'Block borttaget' });
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
    window.open('/', '_blank');
  };

  if (isLoading) {
    return <div className="p-6">Loading blocks...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Landing Page</h2>
          <p className="text-muted-foreground">
            Drag to reorder • Click "Edit" to change content
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Preview
          </Button>
        </div>
      </div>

      {/* Visual Block List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedBlocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {sortedBlocks.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <p>Inga block på sidan ännu.</p>
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
    </div>
  );
};

export default LandingPageManager;
