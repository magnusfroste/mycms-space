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
  Upload,
  Loader2,
  Plus,
} from 'lucide-react';
import type { Project, ProjectImage } from '@/types';

const ProjectShowcaseEditor: React.FC = () => {
  const { data: projects, isLoading } = useProjects();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const deleteProjectImage = useDeleteProjectImage();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
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
      toast({ title: 'Titel och beskrivning krävs', variant: 'destructive' });
      return;
    }
    await updateProject.mutateAsync({ id: editingId, ...editData });
    cancelEditing();
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    await updateProject.mutateAsync({ id, enabled });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Ta bort detta projekt? Alla bilder raderas också.')) {
      await deleteProject.mutateAsync(id);
    }
  };

  const handleDeleteImage = async (image: ProjectImage) => {
    if (confirm('Ta bort denna bild?')) {
      await deleteProjectImage.mutateAsync({ imageId: image.id, imagePath: image.image_path });
    }
  };

  const handleImageUpload = async (projectId: string, file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast({ title: 'Endast JPG, PNG, WEBP eller GIF', variant: 'destructive' });
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
      toast({ title: 'Bild uppladdad' });
    } catch (err) {
      console.error('Upload error:', err);
      toast({ title: 'Kunde inte ladda upp bild', variant: 'destructive' });
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
          Projekt ({enabledProjects.length} aktiva av {projects?.length || 0})
        </h4>
        <p className="text-xs text-muted-foreground">Lägg till nya projekt via Projekt-fliken</p>
      </div>

      <div className="space-y-2">
        {projects?.map((project) => (
          <Card key={project.id} className="p-3">
            {editingId === project.id ? (
              <div className="space-y-3">
                {/* Image gallery */}
                <div className="space-y-2">
                  <Label className="text-xs">Bilder</Label>
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
                          <span className="text-[10px]">Lägg till</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Titel</Label>
                  <Input
                    value={editData.title}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    placeholder="Projektnamn..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Beskrivning</Label>
                  <Textarea
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    placeholder="Kort beskrivning..."
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Demo-länk</Label>
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
                      placeholder="Vilket problem löser det?"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Varför byggdes det?</Label>
                  <Input
                    value={editData.why_built}
                    onChange={(e) => setEditData({ ...editData, why_built: e.target.value })}
                    placeholder="Motivation..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveEditing} size="sm" disabled={updateProject.isPending}>
                    <Check className="h-4 w-4 mr-1" />
                    Spara
                  </Button>
                  <Button variant="ghost" size="sm" onClick={cancelEditing}>
                    <X className="h-4 w-4 mr-1" />
                    Avbryt
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
                        {project.images.length} bild{project.images.length !== 1 ? 'er' : ''}
                      </span>
                    )}
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
            Inga projekt hittades. Lägg till via Projekt-fliken.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectShowcaseEditor;
