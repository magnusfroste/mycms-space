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
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
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
import { Plus } from 'lucide-react';
import type { Project, ProjectImage } from '@/types';
import SortableProjectItem from './SortableProjectItem';
import ProjectForm from './ProjectForm';

interface ProjectFormData {
  title: string;
  description: string;
  demo_link: string;
  problem_statement: string;
  why_built: string;
}

const emptyFormData: ProjectFormData = {
  title: '',
  description: '',
  demo_link: '',
  problem_statement: '',
  why_built: '',
};

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
  const [editData, setEditData] = useState<ProjectFormData>(emptyFormData);
  const [newProjectData, setNewProjectData] = useState<ProjectFormData>(emptyFormData);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const enabledProjects = projects?.filter((p) => p.enabled) || [];
  const sortedProjects = projects ? sortByOrder(projects) : [];

  // Edit handlers
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
    setEditData(emptyFormData);
  };

  const saveEditing = async () => {
    if (!editingId || !editData.title || !editData.description) {
      toast({ title: 'Title and description required', variant: 'destructive' });
      return;
    }
    await updateProject.mutateAsync({ id: editingId, ...editData });
    cancelEditing();
  };

  // Create handlers
  const startCreating = () => {
    setIsCreating(true);
    setEditingId(null);
    setNewProjectData(emptyFormData);
  };

  const cancelCreating = () => {
    setIsCreating(false);
    setNewProjectData(emptyFormData);
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

  // Toggle and delete handlers
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

  // Image upload handlers
  const handleImageUpload = async (projectId: string, file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast({ title: 'Only JPG, PNG, WEBP or GIF', variant: 'destructive' });
      return;
    }

    setUploadingFor(projectId);
    try {
      const { url, path } = await uploadProjectImage(file, projectId);
      const project = projects?.find((p) => p.id === projectId);
      const maxOrder = project?.images?.reduce((max, img) => Math.max(max, img.order_index), -1) ?? -1;

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

  // Drag and drop handler
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !projects) return;

    const oldIndex = sortedProjects.findIndex((p) => p.id === active.id);
    const newIndex = sortedProjects.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...sortedProjects];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const updates = reordered.map((p, idx) => ({ id: p.id, order_index: idx }));
    queryClient.setQueryData(projectKeys.all, reordered.map((p, idx) => ({ ...p, order_index: idx })));

    try {
      await reorderProjects.mutateAsync({ updates });
    } catch {
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
        <ProjectForm
          data={newProjectData}
          onChange={setNewProjectData}
          onSave={saveNewProject}
          onCancel={cancelCreating}
          isSaving={createProject.isPending}
          isCreate
        />
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortedProjects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {sortedProjects.map((project) =>
              editingId === project.id ? (
                <ProjectForm
                  key={project.id}
                  data={editData}
                  onChange={setEditData}
                  onSave={saveEditing}
                  onCancel={cancelEditing}
                  isSaving={updateProject.isPending}
                  projectId={project.id}
                  images={project.images}
                  onDeleteImage={handleDeleteImage}
                  onUploadImage={() => triggerUpload(project.id)}
                  isUploading={uploadingFor === project.id}
                />
              ) : (
                <SortableProjectItem
                  key={project.id}
                  project={project}
                  onEdit={startEditing}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              )
            )}

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
