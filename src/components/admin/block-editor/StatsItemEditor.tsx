// ============================================
// Stats Counter Item Editor
// CRUD interface for statistics items
// ============================================

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatItem {
  id: string;
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  description?: string;
}

interface StatsItemEditorProps {
  items: StatItem[];
  onChange: (items: StatItem[]) => void;
}

const defaultItem: Omit<StatItem, 'id'> = {
  value: 100,
  suffix: '+',
  label: 'New Stat',
  description: 'Stat description',
};

const StatsItemEditor: React.FC<StatsItemEditorProps> = ({ items, onChange }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addItem = () => {
    const newItem: StatItem = {
      ...defaultItem,
      id: crypto.randomUUID(),
    };
    onChange([...items, newItem]);
    setExpandedId(newItem.id);
  };

  const updateItem = (id: string, updates: Partial<StatItem>) => {
    onChange(items.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const deleteItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    onChange(newItems);
  };

  const formatDisplayValue = (item: StatItem) => {
    return `${item.prefix || ''}${item.value}${item.suffix || ''}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Statistics</Label>
        <Button onClick={addItem} size="sm" variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Stat
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <Card 
            key={item.id} 
            className={cn(
              'transition-all duration-200',
              expandedId === item.id && 'ring-2 ring-primary'
            )}
          >
            <div 
              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50"
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-lg tabular-nums">{formatDisplayValue(item)}</div>
                <div className="text-sm text-muted-foreground truncate">{item.label}</div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => { e.stopPropagation(); moveItem(index, 'up'); }}
                  disabled={index === 0}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => { e.stopPropagation(); moveItem(index, 'down'); }}
                  disabled={index === items.length - 1}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {expandedId === item.id && (
              <CardContent className="pt-0 pb-4 space-y-4 border-t">
                <div className="grid gap-4 grid-cols-3 pt-4">
                  <div className="space-y-2">
                    <Label>Prefix</Label>
                    <Input
                      value={item.prefix || ''}
                      onChange={(e) => updateItem(item.id, { prefix: e.target.value })}
                      placeholder="$"
                      className="text-center"
                    />
                    <p className="text-xs text-muted-foreground">e.g. $, €</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Value</Label>
                    <Input
                      type="number"
                      value={item.value}
                      onChange={(e) => updateItem(item.id, { value: parseInt(e.target.value) || 0 })}
                      className="text-center font-bold"
                    />
                    <p className="text-xs text-muted-foreground">Number</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Suffix</Label>
                    <Input
                      value={item.suffix || ''}
                      onChange={(e) => updateItem(item.id, { suffix: e.target.value })}
                      placeholder="+"
                      className="text-center"
                    />
                    <p className="text-xs text-muted-foreground">e.g. +, %, K, M</p>
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <span className="text-2xl font-bold">{formatDisplayValue(item)}</span>
                  <p className="text-xs text-muted-foreground mt-1">Preview</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Label</Label>
                    <Input
                      value={item.label}
                      onChange={(e) => updateItem(item.id, { label: e.target.value })}
                      placeholder="Projects Completed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description (optional)</Label>
                    <Input
                      value={item.description || ''}
                      onChange={(e) => updateItem(item.id, { description: e.target.value })}
                      placeholder="Successful deliveries"
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {items.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <p>No statistics yet. Click "Add Stat" to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsItemEditor;
