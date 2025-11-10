import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  image_url?: string;
  image_path?: string;
}

interface CreateProjectInput {
  title: string;
  description: string;
  demo_link: string;
  problem_statement?: string;
  why_built?: string;
  order_index: number;
  enabled?: boolean;
  image?: File;
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
  image?: File;
  removeImage?: boolean;
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

// Fetch all projects with their first image
export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data: projects, error } = await (supabase as any)
        .from('projects')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;

      // Fetch first image for each project
      const projectsWithImages = await Promise.all(
        (projects || []).map(async (project: any) => {
          const { data: images } = await (supabase as any)
            .from('project_images')
            .select('*')
            .eq('project_id', project.id)
            .order('order_index', { ascending: true })
            .limit(1);

          return {
            ...project,
            image_url: images?.[0]?.image_url,
            image_path: images?.[0]?.image_path,
          } as Project;
        })
      );

      return projectsWithImages;
    },
  });
};

// Create project with single image
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

      // Upload image if provided
      if (input.image && project) {
        const { url, path } = await uploadImageToStorage(input.image, project.id);

        // Create image record
        const { error: imageError } = await (supabase as any)
          .from('project_images')
          .insert({
            project_id: project.id,
            image_url: url,
            image_path: path,
            order_index: 0,
          });

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

// Update project with single image
export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: UpdateProjectInput) => {
      const { id, image, removeImage, ...updateData } = input;

      // Update project record
      const { error: projectError } = await (supabase as any)
        .from('projects')
        .update(updateData)
        .eq('id', id);

      if (projectError) throw projectError;

      // Handle image removal
      if (removeImage) {
        const { data: existingImages } = await (supabase as any)
          .from('project_images')
          .select('image_path')
          .eq('project_id', id);

        if (existingImages && existingImages.length > 0) {
          await Promise.all(
            existingImages.map((img: any) => deleteImageFromStorage(img.image_path))
          );
        }

        await (supabase as any)
          .from('project_images')
          .delete()
          .eq('project_id', id);
      }

      // Handle new image upload
      if (image) {
        // Delete existing images first
        const { data: existingImages } = await (supabase as any)
          .from('project_images')
          .select('image_path')
          .eq('project_id', id);

        if (existingImages && existingImages.length > 0) {
          await Promise.all(
            existingImages.map((img: any) => deleteImageFromStorage(img.image_path))
          );
        }

        await (supabase as any)
          .from('project_images')
          .delete()
          .eq('project_id', id);

        // Upload new image
        const { url, path } = await uploadImageToStorage(image, id);

        await (supabase as any)
          .from('project_images')
          .insert({
            project_id: id,
            image_url: url,
            image_path: path,
            order_index: 0,
          });
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
