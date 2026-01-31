// ============================================
// Expertise Area Editor
// Inline editing for expertise areas within block editor
// Reads/writes to block_config JSONB instead of separate table
// ============================================

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { ExpertiseGridBlockConfig } from '@/types/blockConfigs';
import IconPicker from './IconPicker';

interface ExpertiseAreaEditorProps {
  config: ExpertiseGridBlockConfig;
  onChange: (config: ExpertiseGridBlockConfig) => void;
}

type ExpertiseItem = NonNullable<ExpertiseGridBlockConfig['items']>[number];

const ExpertiseAreaEditor: React.FC<ExpertiseAreaEditorProps> = ({
  config,
  onChange,
}) => {
  const items = config.items || [];
  const sortedItems = [...items].sort((a, b) => a.order_index - b.order_index);

  const handleAddItem = () => {
    const newItem: ExpertiseItem = {
      id: crypto.randomUUID(),
      title: 'New expertise area',
      description: 'Description of the expertise area',
      icon: 'Lightbulb',
      order_index: items.length,
      enabled: true,
    };
    onChange({ ...config, items: [...items, newItem] });
  };

  const handleUpdateItem = (id: string, updates: Partial<ExpertiseItem>) => {
    const updatedItems = items.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    onChange({ ...config, items: updatedItems });
  };

  const handleDeleteItem = (id: string) => {
    const filteredItems = items.filter((item) => item.id !== id);
    // Re-index after deletion
    const reindexed = filteredItems.map((item, idx) => ({
      ...item,
      order_index: idx,
    }));
    onChange({ ...config, items: reindexed });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">
          Expertise Areas ({sortedItems.length})
        </Label>
        <Button onClick={handleAddItem} size="sm" variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Add
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
                    <IconPicker
                      value={item.icon}
                      onChange={(icon) => handleUpdateItem(item.id, { icon })}
                    />
                    <Input
                      value={item.title}
                      onChange={(e) =>
                        handleUpdateItem(item.id, { title: e.target.value })
                      }
                      placeholder="Title"
                      className="flex-1 font-medium"
                    />
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.enabled}
                        onCheckedChange={(enabled) =>
                          handleUpdateItem(item.id, { enabled })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Description */}
                  <Textarea
                    value={item.description}
                    onChange={(e) =>
                      handleUpdateItem(item.id, { description: e.target.value })
                    }
                    placeholder="Description"
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedItems.length === 0 && (
        <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
          <p>No expertise areas yet</p>
          <Button onClick={handleAddItem} variant="link" className="mt-2">
            Add your first expertise area
          </Button>
        </div>
      )}
    </div>
  );
};

export default ExpertiseAreaEditor;
