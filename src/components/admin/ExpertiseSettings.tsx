import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { iconMap } from '@/lib/constants/iconMaps';
import {
  useExpertiseAreas,
  useCreateExpertiseArea,
  useUpdateExpertiseArea,
  useDeleteExpertiseArea,
  useExpertiseAreasSubscription,
  ExpertiseArea,
} from '@/hooks/useExpertiseSettings';

const ExpertiseSettings = () => {
  const { data: areas = [], isLoading } = useExpertiseAreas();
  const createArea = useCreateExpertiseArea();
  const updateArea = useUpdateExpertiseArea();
  const deleteArea = useDeleteExpertiseArea();
  useExpertiseAreasSubscription();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: 'Lightbulb',
    enabled: true,
  });

  const iconOptions = Object.keys(iconMap);

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      icon: 'Lightbulb',
      enabled: true,
    });
  };

  const handleStartEdit = (area: ExpertiseArea) => {
    setEditingId(area.id);
    setIsAdding(false);
    setFormData({
      title: area.title,
      description: area.description,
      icon: area.icon,
      enabled: area.enabled,
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      icon: 'Lightbulb',
      enabled: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      await updateArea.mutateAsync({
        id: editingId,
        ...formData,
      });
    } else {
      const maxOrder = areas.length > 0 ? Math.max(...areas.map(a => a.order_index)) : 0;
      await createArea.mutateAsync({
        ...formData,
        order_index: maxOrder + 1,
      });
    }

    handleCancel();
  };

  const handleDelete = async (id: string) => {
    await deleteArea.mutateAsync(id);
  };

  const handleToggleEnabled = async (area: ExpertiseArea) => {
    await updateArea.mutateAsync({
      id: area.id,
      enabled: !area.enabled,
    });
  };

  const handleReorder = async (area: ExpertiseArea, direction: 'up' | 'down') => {
    const currentIndex = areas.findIndex(a => a.id === area.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= areas.length) return;

    const targetArea = areas[targetIndex];

    await Promise.all([
      updateArea.mutateAsync({
        id: area.id,
        order_index: targetArea.order_index,
      }),
      updateArea.mutateAsync({
        id: targetArea.id,
        order_index: area.order_index,
      }),
    ]);
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Expertise Areas</CardTitle>
          <CardDescription>Manage your areas of expertise displayed on the homepage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isAdding && !editingId && (
            <Button onClick={handleStartAdd} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add New Expertise Area
            </Button>
          )}

          {(isAdding || editingId) && (
            <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData({ ...formData, icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((iconName) => (
                      <SelectItem key={iconName} value={iconName}>
                        <div className="flex items-center gap-2">
                          {iconMap[iconName]}
                          <span>{iconName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                />
                <Label htmlFor="enabled">Enabled</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createArea.isPending || updateArea.isPending}>
                  {editingId ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {areas.map((area, index) => (
              <Card key={area.id} className={!area.enabled ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleReorder(area, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleReorder(area, 'down')}
                        disabled={index === areas.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {iconMap[area.icon]}
                        <h3 className="font-semibold">{area.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{area.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleEnabled(area)}
                        title={area.enabled ? 'Hide' : 'Show'}
                      >
                        {area.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleStartEdit(area)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Expertise Area</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{area.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(area.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpertiseSettings;
