// ============================================
// Project Showcase Editor
// Inline editing for projects in showcase block
// Reads/writes to block_config JSONB instead of separate tables
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
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import type { ProjectShowcaseBlockConfig } from '@/types/blockConfigs';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/utils/imageCompression';
import { useUpdateBlockConfig } from '@/models/blockContent';
import { useQueryClient } from '@tanstack/react-query';
import SortableProjectItem from './SortableProjectItem';
import ProjectForm from './ProjectForm';

interface ProjectShowcaseEditorProps {
  config: ProjectShowcaseBlockConfig;
  onChange: (config: ProjectShowcaseBlockConfig) => void;
  blockId?: string; // Pass block ID to enable auto-save
}

type ProjectItem = NonNullable<ProjectShowcaseBlockConfig['projects']>[number];
type ProjectImage = ProjectItem['images'][number];

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

const ProjectShowcaseEditor: React.FC<ProjectShowcaseEditorProps> = ({
  config,
  onChange,
  blockId,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateBlockConfig = useUpdateBlockConfig();
  const projects = config.projects || [];
  const sortedProjects = [...projects].sort((a, b) => a.order_index - b.order_index);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editData, setEditData] = useState<ProjectFormData>(emptyFormData);
  const [newProjectData, setNewProjectData] = useState<ProjectFormData>(emptyFormData);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const enabledProjects = projects.filter((p) => p.enabled);

  // Auto-save helper - saves directly to database if blockId is provided
  const saveToDatabase = async (updatedProjects: ProjectItem[]) => {
    if (!blockId) {
      // Fallback to onChange only if no blockId
      onChange({ ...config, projects: updatedProjects });
      return;
    }

    setIsSaving(true);
    try {
      await updateBlockConfig.mutateAsync({
        blockId,
        config: { projects: updatedProjects },
      });
      // Also update local state for immediate UI feedback
      onChange({ ...config, projects: updatedProjects });
      toast({ title: 'Ändringar sparade' });
    } catch (err) {
      console.error('Save error:', err);
      toast({ title: 'Kunde inte spara ändringar', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to update projects array (now auto-saves)
  const updateProjects = (updatedProjects: ProjectItem[]) => {
    saveToDatabase(updatedProjects);
  };

  // Edit handlers
  const startEditing = (project: ProjectItem) => {
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

  const saveEditing = () => {
    if (!editingId || !editData.title || !editData.description) {
      toast({ title: 'Title and description required', variant: 'destructive' });
      return;
    }
    const updatedProjects = projects.map((p) =>
      p.id === editingId
        ? { ...p, ...editData }
        : p
    );
    updateProjects(updatedProjects);
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

  const saveNewProject = () => {
    if (!newProjectData.title || !newProjectData.description) {
      toast({ title: 'Title and description required', variant: 'destructive' });
      return;
    }
    const newProject: ProjectItem = {
      id: crypto.randomUUID(),
      title: newProjectData.title,
      description: newProjectData.description,
      demo_link: newProjectData.demo_link || '#',
      problem_statement: newProjectData.problem_statement,
      why_built: newProjectData.why_built,
      order_index: projects.length,
      enabled: true,
      images: [],
      categories: [],
    };
    updateProjects([...projects, newProject]);
    cancelCreating();
  };

  // Toggle and delete handlers
  const handleToggle = (id: string, enabled: boolean) => {
    const updatedProjects = projects.map((p) =>
      p.id === id ? { ...p, enabled } : p
    );
    updateProjects(updatedProjects);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this project? All images will also be removed.')) {
      const filteredProjects = projects.filter((p) => p.id !== id);
      // Re-index
      const reindexed = filteredProjects.map((p, idx) => ({
        ...p,
        order_index: idx,
      }));
      updateProjects(reindexed);
    }
  };

  // Category change handler
  const handleCategoryChange = (projectId: string, slugs: string[]) => {
    const updatedProjects = projects.map((p) =>
      p.id === projectId ? { ...p, categories: slugs } : p
    );
    updateProjects(updatedProjects);
  };

  const handleDeleteImage = (projectId: string, image: ProjectImage) => {
    if (confirm('Delete this image?')) {
      const updatedProjects = projects.map((p) => {
        if (p.id !== projectId) return p;
        const filteredImages = p.images.filter((img) => img.id !== image.id);
        return { ...p, images: filteredImages };
      });
      updateProjects(updatedProjects);
    }
  };

  // Image upload handlers
  const handleImageUpload = async (projectId: string, file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast({ title: 'Only JPG, PNG, WEBP or GIF', variant: 'destructive' });
      return;
    }

    setUploadingFor(projectId);
    setIsSaving(true);

    try {
      // Compress the image
      const compressedFile = await compressImage(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
      });

      const fileExt = compressedFile.name.split('.').pop();
      const filePath = `${projectId}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-images')
        .getPublicUrl(filePath);

      // Add image to project
      const project = projects.find((p) => p.id === projectId);
      const maxOrder = project?.images?.reduce((max, img) => Math.max(max, img.order_index), -1) ?? -1;

      const newImage: ProjectImage = {
        id: crypto.randomUUID(),
        image_url: publicUrl,
        image_path: filePath,
        order_index: maxOrder + 1,
      };

      const updatedProjects = projects.map((p) => {
        if (p.id !== projectId) return p;
        return { ...p, images: [...p.images, newImage] };
      });

      updateProjects(updatedProjects);
      toast({ title: 'Image uploaded' });
    } catch (err) {
      console.error('Upload error:', err);
      toast({ title: 'Could not upload image', variant: 'destructive' });
    } finally {
      setUploadingFor(null);
      setIsSaving(false);
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
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedProjects.findIndex((p) => p.id === active.id);
    const newIndex = sortedProjects.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...sortedProjects];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    // Update order indices
    const updated = reordered.map((p, idx) => ({ ...p, order_index: idx }));
    updateProjects(updated);
  };

  // Adapter for SortableProjectItem which expects Project type
  const projectToLegacyFormat = (p: ProjectItem) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    demo_link: p.demo_link,
    problem_statement: p.problem_statement || null,
    why_built: p.why_built || null,
    order_index: p.order_index,
    enabled: p.enabled,
    created_at: '',
    updated_at: '',
    images: p.images.map((img) => ({
      id: img.id,
      project_id: p.id,
      image_url: img.image_url,
      image_path: img.image_path,
      order_index: img.order_index,
      created_at: '',
    })),
    categories: p.categories.map((slug) => ({
      id: slug,
      name: slug,
      slug,
      order_index: 0,
      enabled: true,
      created_at: '',
      updated_at: '',
    })),
  });

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
          Projects ({enabledProjects.length} active of {projects.length})
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
          isSaving={false}
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
                  isSaving={isSaving}
                  projectId={project.id}
                  images={project.images.map((img) => ({
                    id: img.id,
                    project_id: project.id,
                    image_url: img.image_url,
                    image_path: img.image_path,
                    order_index: img.order_index,
                    created_at: '',
                  }))}
                  onDeleteImage={(img) => handleDeleteImage(project.id, {
                    id: img.id,
                    image_url: img.image_url,
                    image_path: img.image_path,
                    order_index: img.order_index,
                  })}
                  onUploadImage={() => triggerUpload(project.id)}
                  isUploading={uploadingFor === project.id}
                />
              ) : (
                <SortableProjectItem
                  key={project.id}
                  project={projectToLegacyFormat(project)}
                  allCategories={config.categories || []}
                  selectedCategorySlugs={project.categories}
                  onEdit={() => startEditing(project)}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onCategoryChange={handleCategoryChange}
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
