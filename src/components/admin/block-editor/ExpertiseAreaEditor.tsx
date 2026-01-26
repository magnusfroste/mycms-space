// ============================================
// Expertise Area Editor
// Inline editing for expertise areas within block editor
// ============================================

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { useExpertiseAreas, useCreateExpertiseArea, useUpdateExpertiseArea, useDeleteExpertiseArea } from '@/models/expertise';
import type { ExpertiseArea } from '@/types';
import IconPicker from './IconPicker';

const ExpertiseAreaEditor: React.FC = () => {
  const { data: areas = [], isLoading } = useExpertiseAreas();
  const createArea = useCreateExpertiseArea();
  const updateArea = useUpdateExpertiseArea();
  const deleteArea = useDeleteExpertiseArea();

  const sortedAreas = [...areas].sort((a, b) => a.order_index - b.order_index);

  const handleAddArea = () => {
    createArea.mutate({
      title: 'New expertise area',
      description: 'Description of the expertise area',
      icon: 'Lightbulb',
      order_index: areas.length,
      enabled: true,
    });
  };

  const handleUpdateArea = (id: string, updates: Partial<ExpertiseArea>) => {
    updateArea.mutate({ id, ...updates });
  };

  const handleDeleteArea = (id: string) => {
    deleteArea.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Loading expertise areas...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Expertise Areas ({sortedAreas.length})</Label>
        <Button onClick={handleAddArea} size="sm" variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <div className="space-y-3">
        {sortedAreas.map((area) => (
          <Card key={area.id} className="relative">
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
                      value={area.icon}
                      onChange={(icon) => handleUpdateArea(area.id, { icon })}
                    />
                    <Input
                      value={area.title}
                      onChange={(e) => handleUpdateArea(area.id, { title: e.target.value })}
                      placeholder="Title"
                      className="flex-1 font-medium"
                    />
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={area.enabled}
                        onCheckedChange={(enabled) => handleUpdateArea(area.id, { enabled })}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteArea(area.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Description */}
                  <Textarea
                    value={area.description}
                    onChange={(e) => handleUpdateArea(area.id, { description: e.target.value })}
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

      {sortedAreas.length === 0 && (
        <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
          <p>No expertise areas yet</p>
          <Button onClick={handleAddArea} variant="link" className="mt-2">
            Add your first expertise area
          </Button>
        </div>
      )}
    </div>
  );
};

export default ExpertiseAreaEditor;
