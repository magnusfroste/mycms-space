// ============================================
// Project Showcase Editor
// Inline editing for projects in showcase block
// ============================================

import React, { useState, useRef } from 'react';
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useDeleteProjectImage,
  useReorderProjects,
  uploadProjectImage,
  projectKeys,
} from '@/models/projects';
import { sortByOrder } from '@/lib/utils/sorting';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Loader2, Plus, Pencil, Trash2, GripVertical, ExternalLink, Image as ImageIcon } from 'lucide-react';
import type { Project, ProjectImage } from '@/types';
import ProjectCategorySelect from './ProjectCategorySelect';
import SortableProjectItem from './SortableProjectItem';
import AITextEnhance from './AITextEnhance';

const ProjectShowcaseEditor: React.FC = () => {
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const deleteProjectImage = useDeleteProjectImage();
  const reorderProjects = useReorderProjects();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    demo_link: '',
    problem_statement: '',
    why_built: '',
  });
  const [newProjectData, setNewProjectData] = useState({
    title: '',
    description: '',
    demo_link: '',
    problem_statement: '',
    why_built: '',
  });
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const enabledProjects = projects?.filter((p) => p.enabled) || [];

  const startEditing = (project: Project) => {
    setEditingId(project.id);
    setEditData({
      title: project.title,
      description: project.description,
      demo_link: project.demo_link,
      problem_statement: project.problem_statement || '',
      why_built: project.why_built || '',
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditData({ title: '', description: '', demo_link: '', problem_statement: '', why_built: '' });
  };

  const saveEditing = async () => {
    if (!editingId || !editData.title || !editData.description) {
      toast({ title: 'Title and description required', variant: 'destructive' });
      return;
    }
    await updateProject.mutateAsync({ id: editingId, ...editData });
    cancelEditing();
  };

  const startCreating = () => {
    setIsCreating(true);
    setEditingId(null);
    setNewProjectData({
      title: '',
      description: '',
      demo_link: '',
      problem_statement: '',
      why_built: '',
    });
  };

  const cancelCreating = () => {
    setIsCreating(false);
    setNewProjectData({
      title: '',
      description: '',
      demo_link: '',
      problem_statement: '',
      why_built: '',
    });
  };

  const saveNewProject = async () => {
    if (!newProjectData.title || !newProjectData.description) {
      toast({ title: 'Title and description required', variant: 'destructive' });
      return;
    }
    const maxOrder = projects?.reduce((max, p) => Math.max(max, p.order_index), -1) ?? -1;
    await createProject.mutateAsync({
      ...newProjectData,
      order_index: maxOrder + 1,
      enabled: true,
    });
    cancelCreating();
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    await updateProject.mutateAsync({ id, enabled });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this project? All images will also be deleted.')) {
      await deleteProject.mutateAsync(id);
    }
  };

  const handleDeleteImage = async (image: ProjectImage) => {
    if (confirm('Delete this image?')) {
      await deleteProjectImage.mutateAsync({ imageId: image.id, imagePath: image.image_path });
    }
  };

  const handleImageUpload = async (projectId: string, file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast({ title: 'Only JPG, PNG, WEBP or GIF', variant: 'destructive' });
      return;
    }

    setUploadingFor(projectId);
    try {
      const { url, path } = await uploadProjectImage(file, projectId);

      // Get max order_index for this project
      const project = projects?.find((p) => p.id === projectId);
      const maxOrder = project?.images?.reduce((max, img) => Math.max(max, img.order_index), -1) ?? -1;

      // Insert into project_images
      const { error } = await supabase.from('project_images').insert({
        project_id: projectId,
        image_url: url,
        image_path: path,
        order_index: maxOrder + 1,
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      toast({ title: 'Image uploaded' });
    } catch (err) {
      console.error('Upload error:', err);
      toast({ title: 'Could not upload image', variant: 'destructive' });
    } finally {
      setUploadingFor(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerUpload = (projectId: string) => {
    setUploadingFor(projectId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingFor) {
      handleImageUpload(uploadingFor, file);
    }
  };

  // Sort projects by order_index
  const sortedProjects = projects ? sortByOrder(projects) : [];

  // Handle drag end for reordering
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !projects) return;

    const oldIndex = sortedProjects.findIndex((p) => p.id === active.id);
    const newIndex = sortedProjects.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Calculate new order
    const reordered = [...sortedProjects];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    // Build updates with new order_index values
    const updates = reordered.map((p, idx) => ({ id: p.id, order_index: idx }));

    // Optimistic update
    queryClient.setQueryData(projectKeys.all, reordered.map((p, idx) => ({ ...p, order_index: idx })));

    try {
      await reorderProjects.mutateAsync({ updates });
    } catch {
      // Rollback on error
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          Projects ({enabledProjects.length} active of {projects?.length || 0})
        </h4>
        <Button variant="outline" size="sm" onClick={startCreating} disabled={isCreating}>
          <Plus className="h-4 w-4 mr-1" />
          New Project
        </Button>
      </div>

      {/* Create new project form */}
      {isCreating && (
        <Card className="p-4 border-primary/50 bg-primary/5">
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Plus className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Create New Project</span>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Title *</Label>
              <Input
                value={newProjectData.title}
                onChange={(e) => setNewProjectData({ ...newProjectData, title: e.target.value })}
                placeholder="Project name..."
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Description *</Label>
                <AITextEnhance
                  text={newProjectData.description}
                  onTextChange={(text) => setNewProjectData({ ...newProjectData, description: text })}
                  context="project description"
                />
              </div>
              <Textarea
                value={newProjectData.description}
                onChange={(e) => setNewProjectData({ ...newProjectData, description: e.target.value })}
                placeholder="Short description..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Demo Link</Label>
              <Input
                value={newProjectData.demo_link}
                onChange={(e) => setNewProjectData({ ...newProjectData, demo_link: e.target.value })}
                placeholder="https://..."
                type="url"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Problem Statement</Label>
                <AITextEnhance
                  text={newProjectData.problem_statement}
                  onTextChange={(text) => setNewProjectData({ ...newProjectData, problem_statement: text })}
                  context="problem statement"
                />
              </div>
              <Textarea
                value={newProjectData.problem_statement}
                onChange={(e) => setNewProjectData({ ...newProjectData, problem_statement: e.target.value })}
                placeholder="What problem does this project solve?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Why was it built?</Label>
                <AITextEnhance
                  text={newProjectData.why_built}
                  onTextChange={(text) => setNewProjectData({ ...newProjectData, why_built: text })}
                  context="project motivation"
                />
              </div>
              <Textarea
                value={newProjectData.why_built}
                onChange={(e) => setNewProjectData({ ...newProjectData, why_built: e.target.value })}
                placeholder="Motivation and goals..."
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={saveNewProject} size="sm" disabled={createProject.isPending}>
                <Check className="h-4 w-4 mr-1" />
                Create
              </Button>
              <Button variant="ghost" size="sm" onClick={cancelCreating}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedProjects.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {sortedProjects.map((project) => (
              editingId === project.id ? (
                <Card key={project.id} className="p-3">
                  <div className="space-y-3">
                    {/* Image gallery */}
                    <div className="space-y-2">
                      <Label className="text-xs">Images</Label>
                      <div className="flex flex-wrap gap-2">
                        {project.images?.map((img) => (
                          <div key={img.id} className="relative group">
                            <img
                              src={img.image_url}
                              alt=""
                              className="w-20 h-14 object-cover rounded border"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteImage(img)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          className="w-20 h-14 flex flex-col gap-1"
                          onClick={() => triggerUpload(project.id)}
                          disabled={uploadingFor === project.id}
                        >
                          {uploadingFor === project.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Plus className="h-4 w-4" />
                              <span className="text-[10px]">Add</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Title</Label>
                      <Input
                        value={editData.title}
                        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                        placeholder="Project name..."
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Description</Label>
                        <AITextEnhance
                          text={editData.description}
                          onTextChange={(text) => setEditData({ ...editData, description: text })}
                          context="project description"
                        />
                      </div>
                      <Textarea
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        placeholder="Short description..."
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Demo Link</Label>
                      <Input
                        value={editData.demo_link}
                        onChange={(e) => setEditData({ ...editData, demo_link: e.target.value })}
                        placeholder="https://..."
                        type="url"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Problem Statement</Label>
                        <AITextEnhance
                          text={editData.problem_statement}
                          onTextChange={(text) => setEditData({ ...editData, problem_statement: text })}
                          context="problem statement"
                        />
                      </div>
                      <Textarea
                        value={editData.problem_statement}
                        onChange={(e) => setEditData({ ...editData, problem_statement: e.target.value })}
                        placeholder="What problem does this project solve?"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Why was it built?</Label>
                        <AITextEnhance
                          text={editData.why_built}
                          onTextChange={(text) => setEditData({ ...editData, why_built: text })}
                          context="project motivation"
                        />
                      </div>
                      <Textarea
                        value={editData.why_built}
                        onChange={(e) => setEditData({ ...editData, why_built: e.target.value })}
                        placeholder="Motivation and goals..."
                        rows={3}
                      />
                    </div>
                    {/* Category Selection */}
                    <ProjectCategorySelect projectId={project.id} />
                    
                    <div className="flex gap-2">
                      <Button onClick={saveEditing} size="sm" disabled={updateProject.isPending}>
                        <Check className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button variant="ghost" size="sm" onClick={cancelEditing}>
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <SortableProjectItem
                  key={project.id}
                  project={project}
                  onEdit={startEditing}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              )
            ))}

            {sortedProjects.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                No projects found. Click "New Project" to add one.
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default ProjectShowcaseEditor;
