import { useState } from 'react';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject, useDeleteProjectImage, useReorderProjectImages, Project, ProjectImage } from '@/hooks/useProjectSettings';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Image as ImageIcon, X, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProjectFormData {
  title: string;
  description: string;
  demo_link: string;
  problem_statement: string;
  why_built: string;
  enabled: boolean;
  images?: File[];
}

export const ProjectSettings = () => {
  const { data: projects = [], isLoading } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const deleteProjectImage = useDeleteProjectImage();
  const reorderProjectImages = useReorderProjectImages();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isMigrationDialogOpen, setIsMigrationDialogOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);

  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    demo_link: '',
    problem_statement: '',
    why_built: '',
    enabled: true,
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      demo_link: '',
      enabled: true,
      problem_statement: '',
      why_built: '',
    });
    setImagePreviews([]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const currentImages = formData.images || [];
      setFormData({ ...formData, images: [...currentImages, ...files] });
      
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveNewImage = (index: number) => {
    const newImages = [...(formData.images || [])];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
    
    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
  };

  const handleDeleteExistingImage = async (imageId: string, imagePath: string) => {
    await deleteProjectImage.mutateAsync({ imageId, imagePath });
  };

  const handleReorderImage = async (projectId: string, images: ProjectImage[], fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= images.length) return;

    const reorderedImages = [...images];
    const [movedImage] = reorderedImages.splice(fromIndex, 1);
    reorderedImages.splice(toIndex, 0, movedImage);

    const updatedImages = reorderedImages.map((img, idx) => ({
      id: img.id,
      order_index: idx,
    }));

    await reorderProjectImages.mutateAsync({ images: updatedImages });
  };

  const handleAdd = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title and description are required',
        variant: 'destructive',
      });
      return;
    }

    const maxOrder = projects.length > 0 ? Math.max(...projects.map(p => p.order_index)) : -1;
    
    await createProject.mutateAsync({
      ...formData,
      order_index: maxOrder + 1,
    });

    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEdit = async () => {
    if (!editingProject) return;

    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title and description are required',
        variant: 'destructive',
      });
      return;
    }

    await updateProject.mutateAsync({
      id: editingProject.id,
      ...formData,
    });

    setIsEditDialogOpen(false);
    setEditingProject(null);
    resetForm();
  };

  const handleDelete = async () => {
    if (!deleteProjectId) return;
    await deleteProject.mutateAsync(deleteProjectId);
    setDeleteProjectId(null);
  };

  const handleReorder = async (project: Project, direction: 'up' | 'down') => {
    const currentIndex = projects.findIndex(p => p.id === project.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= projects.length) return;

    const targetProject = projects[targetIndex];

    await Promise.all([
      updateProject.mutateAsync({
        id: project.id,
        order_index: targetProject.order_index,
      }),
      updateProject.mutateAsync({
        id: targetProject.id,
        order_index: project.order_index,
      }),
    ]);
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description,
      demo_link: project.demo_link,
      problem_statement: project.problem_statement || '',
      why_built: project.why_built || '',
      enabled: project.enabled,
    });
    setImagePreviews([]);
    setIsEditDialogOpen(true);
  };

  const handleToggleEnabled = async (project: Project) => {
    await updateProject.mutateAsync({
      id: project.id,
      enabled: !project.enabled,
    });
  };

  const handleMigrateFromAirtable = async () => {
    const airtableApiKey = localStorage.getItem('VITE_AIRTABLE_API_KEY');
    const airtableBaseId = localStorage.getItem('VITE_AIRTABLE_BASE_ID');
    const airtableTableId = localStorage.getItem('VITE_AIRTABLE_TABLE_ID') || 'Projects';

    if (!airtableApiKey || !airtableBaseId) {
      toast({
        title: 'Configuration Missing',
        description: 'Please configure your Airtable API settings first.',
        variant: 'destructive',
      });
      return;
    }

    setIsMigrating(true);
    setMigrationResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('migrate-airtable-projects', {
        body: {
          airtableApiKey,
          airtableBaseId,
          airtableTableId,
        },
      });

      if (error) throw error;

      setMigrationResult(data);
      
      if (data.success) {
        // Refresh projects list
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        
        toast({
          title: 'Migration Complete',
          description: `Successfully migrated ${data.projectsCreated} projects with ${data.imagesUploaded} images.`,
        });
      } else {
        toast({
          title: 'Migration Failed',
          description: data.error || 'Unknown error occurred',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Migration error:', error);
      toast({
        title: 'Migration Error',
        description: error.message || 'Failed to migrate projects',
        variant: 'destructive',
      });
    } finally {
      setIsMigrating(false);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading projects...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Project Management</h2>
          <p className="text-muted-foreground">Manage your portfolio projects</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isMigrationDialogOpen} onOpenChange={setIsMigrationDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setMigrationResult(null)}>
                <Download className="mr-2 h-4 w-4" />
                Migrate from Airtable
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Migrate Projects from Airtable</DialogTitle>
                <DialogDescription>
                  This will import all projects from your Airtable base, download images, and save them to the database.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {!isMigrating && !migrationResult && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Make sure your Airtable configuration is set up in localStorage with:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                      <li>VITE_AIRTABLE_API_KEY</li>
                      <li>VITE_AIRTABLE_BASE_ID</li>
                      <li>VITE_AIRTABLE_TABLE_ID (optional, defaults to "Projects")</li>
                    </ul>
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-4">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        ⚠️ This will create new projects in the database. Existing projects will not be affected.
                      </p>
                    </div>
                  </div>
                )}

                {isMigrating && (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-lg font-medium">Migrating projects...</p>
                    <p className="text-sm text-muted-foreground">This may take a few minutes</p>
                  </div>
                )}

                {migrationResult && !isMigrating && (
                  <div className="space-y-4">
                    <div className={`border rounded-lg p-4 ${migrationResult.success ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'}`}>
                      <h3 className="font-semibold mb-2">
                        {migrationResult.success ? '✓ Migration Complete' : '✗ Migration Failed'}
                      </h3>
                      <div className="text-sm space-y-1">
                        <p>Projects created: {migrationResult.projectsCreated}</p>
                        <p>Images uploaded: {migrationResult.imagesUploaded}</p>
                      </div>
                    </div>

                    {migrationResult.projects && migrationResult.projects.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Migrated Projects:</h4>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {migrationResult.projects.map((proj: any, idx: number) => (
                            <div key={idx} className="text-sm flex justify-between px-3 py-2 bg-muted rounded">
                              <span>{proj.title}</span>
                              <span className="text-muted-foreground">{proj.imageCount} images</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {migrationResult.errors && migrationResult.errors.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 text-destructive">Errors:</h4>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {migrationResult.errors.map((error: string, idx: number) => (
                            <div key={idx} className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
                              {error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                {!isMigrating && !migrationResult && (
                  <>
                    <Button variant="outline" onClick={() => setIsMigrationDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleMigrateFromAirtable}>
                      Start Migration
                    </Button>
                  </>
                )}
                {migrationResult && (
                  <Button onClick={() => {
                    setIsMigrationDialogOpen(false);
                    setMigrationResult(null);
                  }}>
                    Close
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Project</DialogTitle>
              </DialogHeader>
              <ProjectForm
                formData={formData}
                setFormData={setFormData}
                imagePreviews={imagePreviews}
                onImageChange={handleImageChange}
                onRemoveNewImage={handleRemoveNewImage}
                onSubmit={handleAdd}
                onCancel={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
                }}
                isLoading={createProject.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Order</TableHead>
              <TableHead className="w-[100px]">Images</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[100px]">Enabled</TableHead>
              <TableHead className="w-[200px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No projects yet. Add your first project!
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project, index) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReorder(project, 'up')}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReorder(project, 'down')}
                        disabled={index === projects.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {project.images && project.images.length > 0 ? (
                        <>
                          <img src={project.images[0].image_url} alt={project.title} className="w-12 h-12 object-cover rounded" />
                          {project.images.length > 1 && (
                            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs font-medium">
                              +{project.images.length - 1}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{project.title}</TableCell>
                  <TableCell className="max-w-xs truncate">{project.description}</TableCell>
                  <TableCell>
                    <Switch
                      checked={project.enabled}
                      onCheckedChange={() => handleToggleEnabled(project)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(project)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteProjectId(project.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
            <ProjectForm
              formData={formData}
              setFormData={setFormData}
              imagePreviews={imagePreviews}
              existingImages={editingProject?.images || []}
              onImageChange={handleImageChange}
              onRemoveNewImage={handleRemoveNewImage}
              onDeleteExistingImage={handleDeleteExistingImage}
              onReorderImage={(fromIndex, direction) => 
                editingProject && handleReorderImage(editingProject.id, editingProject.images || [], fromIndex, direction)
              }
              onSubmit={handleEdit}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setEditingProject(null);
                resetForm();
              }}
              isLoading={updateProject.isPending}
              isEdit
            />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProjectId} onOpenChange={() => setDeleteProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project and all its images. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

interface ProjectFormProps {
  formData: ProjectFormData;
  setFormData: (data: ProjectFormData) => void;
  imagePreviews: string[];
  existingImages?: ProjectImage[];
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveNewImage: (index: number) => void;
  onDeleteExistingImage?: (imageId: string, imagePath: string) => void;
  onReorderImage?: (fromIndex: number, direction: 'up' | 'down') => void;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
  isEdit?: boolean;
}

const ProjectForm = ({
  formData,
  setFormData,
  imagePreviews,
  existingImages = [],
  onImageChange,
  onRemoveNewImage,
  onDeleteExistingImage,
  onReorderImage,
  onSubmit,
  onCancel,
  isLoading,
  isEdit = false,
}: ProjectFormProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Project title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief project description"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="demo_link">Demo Link</Label>
        <Input
          id="demo_link"
          value={formData.demo_link}
          onChange={(e) => setFormData({ ...formData, demo_link: e.target.value })}
          placeholder="https://..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="problem_statement">Problem Statement</Label>
        <Textarea
          id="problem_statement"
          value={formData.problem_statement}
          onChange={(e) => setFormData({ ...formData, problem_statement: e.target.value })}
          placeholder="What problem does this solve?"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="why_built">Why Built</Label>
        <Textarea
          id="why_built"
          value={formData.why_built}
          onChange={(e) => setFormData({ ...formData, why_built: e.target.value })}
          placeholder="Why was this project built?"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="images">Project Images</Label>
        
        {/* Existing Images (only in edit mode) */}
        {isEdit && existingImages.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Existing Images</p>
            <div className="grid grid-cols-2 gap-2">
              {existingImages.map((image, index) => (
                <div key={image.id} className="relative border rounded-lg overflow-hidden">
                  <img src={image.image_url} alt={`Image ${index + 1}`} className="w-full h-32 object-cover" />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => onReorderImage?.(index, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => onReorderImage?.(index, 'down')}
                      disabled={index === existingImages.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => onDeleteExistingImage?.(image.id, image.image_path)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-background/80 px-2 py-1 rounded text-xs">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">New Images</p>
            <div className="grid grid-cols-2 gap-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative border rounded-lg overflow-hidden">
                  <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-32 object-cover" />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-7 w-7 p-0"
                    onClick={() => onRemoveNewImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="absolute bottom-2 left-2 bg-background/80 px-2 py-1 rounded text-xs">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Input
          id="images"
          type="file"
          accept="image/*"
          multiple
          onChange={onImageChange}
        />
        <p className="text-xs text-muted-foreground">You can select multiple images</p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="enabled"
          checked={formData.enabled}
          onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
        />
        <Label htmlFor="enabled">Enabled</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={isLoading}>
          {isLoading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
        </Button>
      </div>
    </div>
  );
};
