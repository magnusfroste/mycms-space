import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProjectImage {
  id: string;
  project_id: string;
  image_url: string;
  image_path: string;
  order_index: number;
  created_at: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  demo_link: string;
  problem_statement?: string | null;
  why_built?: string | null;
  order_index: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  images?: ProjectImage[];
}

interface CreateProjectInput {
  title: string;
  description: string;
  demo_link: string;
  problem_statement?: string;
  why_built?: string;
  order_index: number;
  enabled?: boolean;
  images?: File[];
}

interface UpdateProjectInput {
  id: string;
  title?: string;
  description?: string;
  demo_link?: string;
  problem_statement?: string;
  why_built?: string;
  order_index?: number;
  enabled?: boolean;
  newImages?: File[];
}

// Helper: Upload image to storage
export const uploadImageToStorage = async (file: File, projectId: string): Promise<{ url: string; path: string }> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${projectId}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('project-images')
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('project-images')
    .getPublicUrl(filePath);

  return { url: publicUrl, path: filePath };
};

// Helper: Delete image from storage
export const deleteImageFromStorage = async (path: string): Promise<void> => {
  const { error } = await supabase.storage
    .from('project-images')
    .remove([path]);

  if (error) throw error;
};

// Fetch all projects with all their images
export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data: projects, error } = await (supabase as any)
        .from('projects')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;

      // Fetch all images for each project
      const projectsWithImages = await Promise.all(
        (projects || []).map(async (project: any) => {
          const { data: images } = await (supabase as any)
            .from('project_images')
            .select('*')
            .eq('project_id', project.id)
            .order('order_index', { ascending: true });

          return {
            ...project,
            images: images || [],
          } as Project;
        })
      );

      return projectsWithImages;
    },
  });
};

// Create project with multiple images
export const useCreateProject = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      // Create project record
      const { data: project, error: projectError } = await (supabase as any)
        .from('projects')
        .insert({
          title: input.title,
          description: input.description,
          demo_link: input.demo_link,
          problem_statement: input.problem_statement,
          why_built: input.why_built,
          order_index: input.order_index,
          enabled: input.enabled ?? true,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Upload images if provided
      if (input.images && input.images.length > 0 && project) {
        const imageRecords = await Promise.all(
          input.images.map(async (file, index) => {
            const { url, path } = await uploadImageToStorage(file, project.id);
            return {
              project_id: project.id,
              image_url: url,
              image_path: path,
              order_index: index,
            };
          })
        );

        const { error: imageError } = await (supabase as any)
          .from('project_images')
          .insert(imageRecords);

        if (imageError) throw imageError;
      }

      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: 'Success',
        description: 'Project created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to create project: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

// Update project with multiple images support
export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: UpdateProjectInput) => {
      const { id, newImages, ...updateData } = input;

      // Update project record
      const { error: projectError } = await (supabase as any)
        .from('projects')
        .update(updateData)
        .eq('id', id);

      if (projectError) throw projectError;

      // Handle new images upload
      if (newImages && newImages.length > 0) {
        // Get current max order_index
        const { data: existingImages } = await (supabase as any)
          .from('project_images')
          .select('order_index')
          .eq('project_id', id)
          .order('order_index', { ascending: false })
          .limit(1);

        const maxOrder = existingImages?.[0]?.order_index ?? -1;

        const imageRecords = await Promise.all(
          newImages.map(async (file, index) => {
            const { url, path } = await uploadImageToStorage(file, id);
            return {
              project_id: id,
              image_url: url,
              image_path: path,
              order_index: maxOrder + index + 1,
            };
          })
        );

        const { error: imageError } = await (supabase as any)
          .from('project_images')
          .insert(imageRecords);

        if (imageError) throw imageError;
      }

      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: 'Success',
        description: 'Project updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to update project: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

// Delete project and its images
export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (projectId: string) => {
      // Get all images for this project
      const { data: images } = await (supabase as any)
        .from('project_images')
        .select('image_path')
        .eq('project_id', projectId);

      // Delete images from storage
      if (images && images.length > 0) {
        await Promise.all(
          images.map((img: any) => deleteImageFromStorage(img.image_path))
        );
      }

      // Delete image records
      await (supabase as any)
        .from('project_images')
        .delete()
        .eq('project_id', projectId);

      // Delete project
      const { error } = await (supabase as any)
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: 'Success',
        description: 'Project deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to delete project: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

// Delete a single project image
export const useDeleteProjectImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ imageId, imagePath }: { imageId: string; imagePath: string }) => {
      // Delete from storage
      await deleteImageFromStorage(imagePath);

      // Delete record
      const { error } = await (supabase as any)
        .from('project_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: 'Success',
        description: 'Image deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to delete image: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

// Reorder project images
export const useReorderProjectImages = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ images }: { images: { id: string; order_index: number }[] }) => {
      // Update all image order_index values
      const updates = images.map((img) =>
        (supabase as any)
          .from('project_images')
          .update({ order_index: img.order_index })
          .eq('id', img.id)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: 'Success',
        description: 'Images reordered successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to reorder images: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

// Bulk reorder projects - DOES NOT invalidate cache
export const useReorderProjects = () => {
  return useMutation({
    mutationFn: async ({ updates }: { updates: { id: string; order_index: number }[] }) => {
      // Update all project order_index values in parallel
      await Promise.all(
        updates.map((update) =>
          (supabase as any)
            .from('projects')
            .update({ order_index: update.order_index })
            .eq('id', update.id)
        )
      );
    },
    // No onSuccess/onError - let the component handle it
  });
};
