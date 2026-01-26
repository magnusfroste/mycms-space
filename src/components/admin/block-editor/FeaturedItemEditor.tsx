// ============================================
// Featured Item Editor
// Inline editing for featured items within block editor
// ============================================

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { useFeaturedItems, useCreateFeaturedItem, useUpdateFeaturedItem, useDeleteFeaturedItem } from '@/models/featured';
import type { FeaturedItem } from '@/types';
import ImageUpload from './ImageUpload';

const FeaturedItemEditor: React.FC = () => {
  const { data: items = [], isLoading } = useFeaturedItems();
  const createItem = useCreateFeaturedItem();
  const updateItem = useUpdateFeaturedItem();
  const deleteItem = useDeleteFeaturedItem();

  const sortedItems = [...items].sort((a, b) => a.order_index - b.order_index);

  const handleAddItem = () => {
    createItem.mutate({
      title: 'Ny featured',
      description: 'Beskrivning',
      enabled: true,
    });
  };

  const handleUpdateItem = (item: FeaturedItem, updates: Partial<FeaturedItem>) => {
    updateItem.mutate({ ...item, ...updates });
  };

  const handleDeleteItem = (item: FeaturedItem) => {
    deleteItem.mutate({ id: item.id, imagePath: item.image_path });
  };

  if (isLoading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Laddar featured items...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Featured Items ({sortedItems.length})</Label>
        <Button onClick={handleAddItem} size="sm" variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Lägg till
        </Button>
      </div>

      <div className="space-y-3">
        {sortedItems.map((item) => (
          <Card key={item.id} className="relative">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Drag handle placeholder */}
                <div className="mt-2 cursor-grab text-muted-foreground">
                  <GripVertical className="h-5 w-5" />
                </div>

                <div className="flex-1 space-y-3">
                  {/* Header row */}
                  <div className="flex items-center gap-3">
                    <Input
                      value={item.title}
                      onChange={(e) => handleUpdateItem(item, { title: e.target.value })}
                      placeholder="Titel"
                      className="flex-1 font-medium"
                    />
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.enabled}
                        onCheckedChange={(enabled) => handleUpdateItem(item, { enabled })}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteItem(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Content row */}
                  <div className="grid gap-3 md:grid-cols-2">
                    <ImageUpload
                      label="Bild"
                      value={item.image_url || ''}
                      onChange={(url) => handleUpdateItem(item, { 
                        image_url: url,
                        image_path: url ? url.split('/').pop() || null : null
                      })}
                      bucket="featured-images"
                    />
                    <Textarea
                      value={item.description}
                      onChange={(e) => handleUpdateItem(item, { description: e.target.value })}
                      placeholder="Beskrivning"
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedItems.length === 0 && (
        <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
          <p>Inga featured items ännu</p>
          <Button onClick={handleAddItem} variant="link" className="mt-2">
            Lägg till ditt första featured item
          </Button>
        </div>
      )}
    </div>
  );
};

export default FeaturedItemEditor;
