// ============================================
// Values Editor
// Editor for core values and beliefs
// ============================================

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { ValuesBlockConfig } from '@/types/blockConfigs';
import IconPicker from './IconPicker';

interface ValuesEditorProps {
  config: ValuesBlockConfig;
  onChange: (config: ValuesBlockConfig) => void;
}

type ValueItem = NonNullable<ValuesBlockConfig['values']>[number];

const ValuesEditor: React.FC<ValuesEditorProps> = ({
  config,
  onChange,
}) => {
  const values = config.values || [];

  const handleAddValue = () => {
    const newValue: ValueItem = {
      id: crypto.randomUUID(),
      title: 'New Value',
      description: 'Describe what this value means to you.',
      icon: 'Heart',
      enabled: true,
    };
    onChange({ ...config, values: [...values, newValue] });
  };

  const handleUpdateValue = (id: string, updates: Partial<ValueItem>) => {
    const updatedValues = values.map((value) =>
      value.id === id ? { ...value, ...updates } : value
    );
    onChange({ ...config, values: updatedValues });
  };

  const handleDeleteValue = (id: string) => {
    onChange({ ...config, values: values.filter((value) => value.id !== id) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">
          Values ({values.length})
        </Label>
        <Button onClick={handleAddValue} size="sm" variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <div className="space-y-3">
        {values.map((value) => (
          <Card key={value.id} className="relative">
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
                      value={value.icon}
                      onChange={(icon) => handleUpdateValue(value.id, { icon })}
                    />
                    <Input
                      value={value.title}
                      onChange={(e) =>
                        handleUpdateValue(value.id, { title: e.target.value })
                      }
                      placeholder="Value title"
                      className="flex-1 font-medium"
                    />
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={value.enabled}
                        onCheckedChange={(enabled) =>
                          handleUpdateValue(value.id, { enabled })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteValue(value.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Description */}
                  <Textarea
                    value={value.description}
                    onChange={(e) =>
                      handleUpdateValue(value.id, { description: e.target.value })
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

      {values.length === 0 && (
        <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
          <p>No values yet</p>
          <Button onClick={handleAddValue} variant="link" className="mt-2">
            Add your first value
          </Button>
        </div>
      )}
    </div>
  );
};

export default ValuesEditor;
