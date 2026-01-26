// ============================================
// Project Showcase Editor
// Inline editing for projects in showcase block
// ============================================

import React, { useState, useRef } from 'react';
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
  uploadProjectImage,
} from '@/models/projects';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { projectKeys } from '@/models/projects';
import { useToast } from '@/hooks/use-toast';
import {
  Pencil,
  Trash2,
  GripVertical,
  Check,
  X,
  ExternalLink,
  Image,
  Loader2,
  Plus,
} from 'lucide-react';
import type { Project, ProjectImage } from '@/types';
import ProjectCategorySelect from './ProjectCategorySelect';

const ProjectShowcaseEditor: React.FC = () => {
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const deleteProjectImage = useDeleteProjectImage();
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
              <Label className="text-xs">Description *</Label>
              <Textarea
                value={newProjectData.description}
                onChange={(e) => setNewProjectData({ ...newProjectData, description: e.target.value })}
                placeholder="Short description..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
                <Label className="text-xs">Problem</Label>
                <Input
                  value={newProjectData.problem_statement}
                  onChange={(e) => setNewProjectData({ ...newProjectData, problem_statement: e.target.value })}
                  placeholder="What problem does it solve?"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Why was it built?</Label>
              <Input
                value={newProjectData.why_built}
                onChange={(e) => setNewProjectData({ ...newProjectData, why_built: e.target.value })}
                placeholder="Motivation..."
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

      <div className="space-y-2">
        {projects?.map((project) => (
          <Card key={project.id} className="p-3">
            {editingId === project.id ? (
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
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    placeholder="Short description..."
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                    <Label className="text-xs">Problem</Label>
                    <Input
                      value={editData.problem_statement}
                      onChange={(e) => setEditData({ ...editData, problem_statement: e.target.value })}
                      placeholder="What problem does it solve?"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Why was it built?</Label>
                  <Input
                    value={editData.why_built}
                    onChange={(e) => setEditData({ ...editData, why_built: e.target.value })}
                    placeholder="Motivation..."
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
            ) : (
              <div className="flex items-start gap-3">
                <GripVertical className="h-4 w-4 text-muted-foreground/50 mt-1 shrink-0" />

                {/* Thumbnail */}
                <div className="w-16 h-12 rounded bg-muted shrink-0 overflow-hidden">
                  {project.images && project.images.length > 0 ? (
                    <img
                      src={project.images[0].image_url}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{project.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{project.description}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {project.demo_link && project.demo_link !== '#' && (
                      <a
                        href={project.demo_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Demo
                      </a>
                    )}
                    {project.images && project.images.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {project.images.length} image{project.images.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {/* Compact category select in list view */}
                    <ProjectCategorySelect projectId={project.id} compact />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => startEditing(project)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Switch
                    checked={project.enabled}
                    onCheckedChange={(checked) => handleToggle(project.id, checked)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(project.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}

        {(!projects || projects.length === 0) && (
          <div className="py-8 text-center text-muted-foreground">
            No projects found. Add via the Projects tab.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectShowcaseEditor;
