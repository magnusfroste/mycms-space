// ============================================
// Block Settings Admin Component
// Manage page blocks with drag-and-drop, CRUD
// ============================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, GripVertical, Layout, Type, Image, MessageSquare, Grid, Layers, ArrowRight, Minus, ExternalLink } from 'lucide-react';
import { ImageUpload } from './block-editor';
import BlockTypePicker, { BLOCK_TYPE_OPTIONS } from './block-editor/BlockTypePicker';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
  useAllPageBlocks,
  useCreatePageBlock,
  useUpdatePageBlock,
  useDeletePageBlock,
  useReorderPageBlocks,
  pageBlocksKeys,
} from '@/models/pageBlocks';
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
// Use BLOCK_TYPE_OPTIONS from BlockTypePicker for consistency

// Get available pages from blocks
const getUniquePages = (blocks: PageBlock[]): string[] => {
  const pages = new Set(blocks.map((b) => b.page_slug));
  return Array.from(pages).sort();
};

interface SortableBlockItemProps {
  block: PageBlock;
  onToggleEnabled: (block: PageBlock) => void;
  onEdit: (block: PageBlock) => void;
  onDelete: (id: string) => void;
}

const SortableBlockItem = ({ block, onToggleEnabled, onEdit, onDelete }: SortableBlockItemProps) => {
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
    opacity: isDragging ? 0.5 : 1,
  };

  const blockMeta = BLOCK_TYPE_OPTIONS.find((bt) => bt.type === block.block_type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-card border rounded-lg"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="flex items-center gap-2 text-muted-foreground">
        {blockMeta?.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{blockMeta?.label || block.block_type}</span>
          <Badge variant="outline" className="text-xs">
            {block.block_type}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {getBlockConfigSummary(block)}
        </p>
      </div>

      <Switch
        checked={block.enabled}
        onCheckedChange={() => onToggleEnabled(block)}
      />

      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => onEdit(block)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(block.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
};

// Helper to summarize block config
const getBlockConfigSummary = (block: PageBlock): string => {
  const config = block.block_config;
  switch (block.block_type) {
    case 'text-section':
      return (config.title as string) || 'No title set';
    case 'image-text':
      return (config.title as string) || 'Image + Text block';
    case 'cta-banner':
      return (config.title as string) || 'CTA Banner';
    case 'spacer':
      return `Height: ${(config.height as string) || 'md'}`;
    default:
      return config.data_source ? `Source: ${config.data_source}` : 'Default configuration';
  }
};

interface BlockFormData {
  page_slug: string;
  block_type: BlockType;
  block_config: Record<string, unknown>;
  enabled: boolean;
}

const defaultFormData: BlockFormData = {
  page_slug: 'demo',
  block_type: 'text-section',
  block_config: {},
  enabled: true,
};

export const BlockSettings = () => {
  const { data: allBlocks = [], isLoading } = useAllPageBlocks();
  const createBlock = useCreatePageBlock();
  const updateBlock = useUpdatePageBlock();
  const deleteBlock = useDeletePageBlock();
  const reorderBlocks = useReorderPageBlocks();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedPage, setSelectedPage] = useState<string>('demo');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<PageBlock | null>(null);
  const [deleteBlockId, setDeleteBlockId] = useState<string | null>(null);
  const [newPageSlug, setNewPageSlug] = useState('');

  const [formData, setFormData] = useState<BlockFormData>(defaultFormData);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter blocks for selected page
  const pageBlocks = allBlocks
    .filter((b) => b.page_slug === selectedPage)
    .sort((a, b) => a.order_index - b.order_index);

  const availablePages = getUniquePages(allBlocks);
  if (!availablePages.includes('demo')) availablePages.unshift('demo');
  if (!availablePages.includes('home')) availablePages.unshift('home');

  const resetForm = () => {
    setFormData({ ...defaultFormData, page_slug: selectedPage });
  };

  const handleAdd = async () => {
    const targetPage = newPageSlug.trim() || formData.page_slug;
    
    if (!targetPage) {
      toast({ title: 'Error', description: 'Page slug is required', variant: 'destructive' });
      return;
    }

    const maxOrder = pageBlocks.length > 0 ? Math.max(...pageBlocks.map((b) => b.order_index)) : -1;

    await createBlock.mutateAsync({
      page_slug: targetPage,
      block_type: formData.block_type,
      block_config: formData.block_config,
      order_index: maxOrder + 1,
      enabled: formData.enabled,
    });

    setIsAddDialogOpen(false);
    setNewPageSlug('');
    resetForm();
    
    // Switch to new page if created
    if (targetPage !== selectedPage) {
      setSelectedPage(targetPage);
    }
    
    toast({ title: 'Success', description: 'Block added' });
  };

  const handleEdit = async () => {
    if (!editingBlock) return;

    await updateBlock.mutateAsync({
      id: editingBlock.id,
      block_type: formData.block_type,
      block_config: formData.block_config,
      enabled: formData.enabled,
    });

    setIsEditDialogOpen(false);
    setEditingBlock(null);
    resetForm();
    toast({ title: 'Success', description: 'Block updated' });
  };

  const handleDelete = async () => {
    if (!deleteBlockId) return;
    await deleteBlock.mutateAsync(deleteBlockId);
    setDeleteBlockId(null);
    toast({ title: 'Success', description: 'Block deleted' });
  };

  const handleToggleEnabled = async (block: PageBlock) => {
    await updateBlock.mutateAsync({
      id: block.id,
      enabled: !block.enabled,
    });
  };

  const openEditDialog = (block: PageBlock) => {
    setEditingBlock(block);
    setFormData({
      page_slug: block.page_slug,
      block_type: block.block_type,
      block_config: block.block_config,
      enabled: block.enabled,
    });
    setIsEditDialogOpen(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = pageBlocks.findIndex((b) => b.id === active.id);
    const newIndex = pageBlocks.findIndex((b) => b.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(pageBlocks, oldIndex, newIndex).map((b, index) => ({
      ...b,
      order_index: index,
    }));

    // Optimistic update
    queryClient.setQueryData(pageBlocksKeys.all, (old: PageBlock[] = []) =>
      old.map((b) => {
        const updated = reordered.find((r) => r.id === b.id);
        return updated || b;
      })
    );

    try {
      await reorderBlocks.mutateAsync(
        reordered.map((b) => ({ id: b.id, order_index: b.order_index }))
      );
      toast({ title: 'Success', description: 'Block order updated' });
    } catch {
      queryClient.invalidateQueries({ queryKey: pageBlocksKeys.all });
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading blocks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Landing Page</h2>
          <p className="text-muted-foreground">Manage blocks and their order on the page</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open('/', '_blank')}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Preview
          </Button>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Block
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Block</DialogTitle>
              </DialogHeader>
              <BlockForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleAdd}
                onCancel={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
                }}
                isLoading={createBlock.isPending}
                availablePages={availablePages}
                newPageSlug={newPageSlug}
                setNewPageSlug={setNewPageSlug}
                showPageSelector
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Page Tabs */}
      <Tabs value={selectedPage} onValueChange={setSelectedPage}>
        <TabsList>
          {availablePages.map((page) => (
            <TabsTrigger key={page} value={page} className="capitalize">
              {page}
            </TabsTrigger>
          ))}
        </TabsList>

        {availablePages.map((page) => (
          <TabsContent key={page} value={page}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={pageBlocks.map((b) => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {pageBlocks.length === 0 ? (
                    <Card className="p-8 text-center text-muted-foreground">
                      <p>No blocks on this page yet.</p>
                      <p className="text-sm mt-1">Click "Add Block" to get started.</p>
                    </Card>
                  ) : (
                    pageBlocks.map((block) => (
                      <SortableBlockItem
                        key={block.id}
                        block={block}
                        onToggleEnabled={handleToggleEnabled}
                        onEdit={openEditDialog}
                        onDelete={setDeleteBlockId}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Block</DialogTitle>
          </DialogHeader>
          <BlockForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleEdit}
            onCancel={() => {
              setIsEditDialogOpen(false);
              setEditingBlock(null);
              resetForm();
            }}
            isLoading={updateBlock.isPending}
            isEdit
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteBlockId} onOpenChange={() => setDeleteBlockId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete block?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the block from the page. This action cannot be undone.
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

interface BlockFormProps {
  formData: BlockFormData;
  setFormData: (data: BlockFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
  isEdit?: boolean;
  availablePages?: string[];
  newPageSlug?: string;
  setNewPageSlug?: (slug: string) => void;
  showPageSelector?: boolean;
}

const BlockForm = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isLoading,
  isEdit,
  availablePages = [],
  newPageSlug = '',
  setNewPageSlug,
  showPageSelector,
}: BlockFormProps) => {
  return (
    <div className="space-y-4">
      {/* Page Selector (only for new blocks) */}
      {showPageSelector && (
        <div className="space-y-2">
          <Label>Page</Label>
          <div className="flex gap-2">
            <Select
              value={formData.page_slug}
              onValueChange={(value) => {
                setFormData({ ...formData, page_slug: value });
                setNewPageSlug?.('');
              }}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availablePages.map((page) => (
                  <SelectItem key={page} value={page} className="capitalize">
                    {page}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground self-center">or</span>
            <Input
              placeholder="New page slug"
              value={newPageSlug}
              onChange={(e) => setNewPageSlug?.(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
      )}

      {/* Block Type Picker with Previews */}
      <BlockTypePicker
        value={formData.block_type}
        onChange={(type) => setFormData({ ...formData, block_type: type, block_config: {} })}
      />

      {/* Block-specific config */}
      <BlockConfigEditor
        blockType={formData.block_type}
        config={formData.block_config}
        onChange={(config) => setFormData({ ...formData, block_config: config })}
      />

      {/* Enabled toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Enabled</Label>
          <p className="text-xs text-muted-foreground">Show this block on the page</p>
        </div>
        <Switch
          checked={formData.enabled}
          onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={isLoading}>
          {isLoading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Block'}
        </Button>
      </div>
    </div>
  );
};

interface BlockConfigEditorProps {
  blockType: BlockType;
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

const BlockConfigEditor = ({ blockType, config, onChange }: BlockConfigEditorProps) => {
  const updateConfig = (key: string, value: unknown) => {
    onChange({ ...config, [key]: value });
  };

  switch (blockType) {
    case 'text-section':
      return (
        <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={(config.title as string) || ''}
              onChange={(e) => updateConfig('title', e.target.value)}
              placeholder="Section title"
            />
          </div>
          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea
              value={(config.content as string) || ''}
              onChange={(e) => updateConfig('content', e.target.value)}
              placeholder="Section content..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Alignment</Label>
            <Select
              value={(config.alignment as string) || 'center'}
              onValueChange={(value) => updateConfig('alignment', value)}
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
        </div>
      );

    case 'image-text':
      return (
        <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={(config.title as string) || ''}
              onChange={(e) => updateConfig('title', e.target.value)}
              placeholder="Block title"
            />
          </div>
          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea
              value={(config.content as string) || ''}
              onChange={(e) => updateConfig('content', e.target.value)}
              placeholder="Write content..."
              rows={3}
            />
          </div>
          <ImageUpload
            label="Image"
            value={(config.image_url as string) || ''}
            onChange={(url) => updateConfig('image_url', url)}
            bucket="about-me-images"
          />
          <div className="space-y-2">
            <Label>Image Position</Label>
            <Select
              value={(config.image_position as string) || 'left'}
              onValueChange={(value) => updateConfig('image_position', value)}
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
      );

    case 'cta-banner':
      return (
        <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={(config.title as string) || ''}
              onChange={(e) => updateConfig('title', e.target.value)}
              placeholder="Ready to get started?"
            />
          </div>
          <div className="space-y-2">
            <Label>Subtitle</Label>
            <Input
              value={(config.subtitle as string) || ''}
              onChange={(e) => updateConfig('subtitle', e.target.value)}
              placeholder="Optional subtitle..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Button Text</Label>
              <Input
                value={(config.button_text as string) || ''}
                onChange={(e) => updateConfig('button_text', e.target.value)}
                placeholder="Get Started"
              />
            </div>
            <div className="space-y-2">
              <Label>Button URL</Label>
              <Input
                value={(config.button_url as string) || ''}
                onChange={(e) => updateConfig('button_url', e.target.value)}
                placeholder="/chat"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Style</Label>
            <Select
              value={(config.style as string) || 'default'}
              onValueChange={(value) => updateConfig('style', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="gradient">Gradient</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'spacer':
      return (
        <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <Label>Height</Label>
            <Select
              value={(config.height as string) || 'md'}
              onValueChange={(value) => updateConfig('height', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="md">Medium</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
                <SelectItem value="xl">Extra Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'expertise-grid':
      return (
        <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <Label>Columns</Label>
            <Select
              value={String((config.columns as number) || 3)}
              onValueChange={(value) => updateConfig('columns', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 Columns</SelectItem>
                <SelectItem value="3">3 Columns</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Data is loaded from the Expertise Areas settings.
          </p>
        </div>
      );

    case 'hero':
    case 'chat-widget':
    case 'about-split':
    case 'featured-carousel':
    case 'project-showcase':
      return (
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            This block uses data from the database. Configure it in the corresponding admin section.
          </p>
        </div>
      );

    default:
      return null;
  }
};

export default BlockSettings;
