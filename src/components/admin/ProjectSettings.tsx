import { useState } from 'react';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject, Project } from '@/hooks/useProjectSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProjectFormData {
  title: string;
  description: string;
  demo_link: string;
  problem_statement: string;
  why_built: string;
  enabled: boolean;
  image?: File;
  removeImage?: boolean;
}

export const ProjectSettings = () => {
  const { data: projects = [], isLoading } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file, removeImage: false });
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image: undefined, removeImage: true });
    setImagePreview(null);
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
    setImagePreview(project.image_url || null);
    setIsEditDialogOpen(true);
  };

  const handleToggleEnabled = async (project: Project) => {
    await updateProject.mutateAsync({
      id: project.id,
      enabled: !project.enabled,
    });
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
              imagePreview={imagePreview}
              onImageChange={handleImageChange}
              onRemoveImage={handleRemoveImage}
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

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Order</TableHead>
              <TableHead className="w-[80px]">Image</TableHead>
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
                    {project.image_url ? (
                      <img src={project.image_url} alt={project.title} className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
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
            imagePreview={imagePreview}
            onImageChange={handleImageChange}
            onRemoveImage={handleRemoveImage}
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
  imagePreview: string | null;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
  isEdit?: boolean;
}

const ProjectForm = ({
  formData,
  setFormData,
  imagePreview,
  onImageChange,
  onRemoveImage,
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
        <Label htmlFor="image">Project Image</Label>
        {imagePreview && (
          <div className="relative w-full h-48 border rounded-lg overflow-hidden">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={onRemoveImage}
            >
              Remove
            </Button>
          </div>
        )}
        <Input
          id="image"
          type="file"
          accept="image/*"
          onChange={onImageChange}
        />
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
