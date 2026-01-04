// ============================================
// Data Layer: Projects
// Pure Supabase API calls - no UI logic
// ============================================

import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/utils/imageCompression';
import type { Project, ProjectImage, CreateProjectInput, UpdateProjectInput } from '@/types';

// Storage operations
export const uploadProjectImage = async (
  file: File,
  projectId: string
): Promise<{ url: string; path: string }> => {
  const compressedFile = await compressImage(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
  });

  const fileExt = compressedFile.name.split('.').pop();
  const fileName = `${projectId}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('project-images')
    .upload(fileName, compressedFile, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('project-images')
    .getPublicUrl(fileName);

  return { url: publicUrl, path: fileName };
};

export const deleteProjectImageFromStorage = async (path: string): Promise<void> => {
  const { error } = await supabase.storage
    .from('project-images')
    .remove([path]);

  if (error) throw error;
};

// Database operations
export const fetchProjects = async (): Promise<Project[]> => {
  const { data: projects, error } = await (supabase as any)
    .from('projects')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) throw error;

  // Fetch images for each project
  const projectsWithImages = await Promise.all(
    (projects || []).map(async (project: any) => {
      const { data: images, error: imagesError } = await (supabase as any)
        .from('project_images')
        .select('*')
        .eq('project_id', project.id)
        .order('order_index', { ascending: true });

      if (imagesError) {
        console.error(`Error fetching images for project ${project.id}:`, imagesError);
      }

      return { ...project, images: images || [] } as Project;
    })
  );

  return projectsWithImages;
};

export const createProject = async (input: CreateProjectInput): Promise<Project> => {
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

  if (input.images && input.images.length > 0 && project) {
    const imageRecords = await Promise.all(
      input.images.map(async (file, index) => {
        const { url, path } = await uploadProjectImage(file, project.id);
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
};

export const updateProject = async (input: UpdateProjectInput): Promise<{ id: string }> => {
  const { id, newImages, ...rest } = input as any;
  const { images: _omit, ...updateData } = rest;

  const { error: projectError } = await (supabase as any)
    .from('projects')
    .update(updateData)
    .eq('id', id);

  if (projectError) throw projectError;

  if (newImages && newImages.length > 0) {
    const { data: existingImages } = await (supabase as any)
      .from('project_images')
      .select('order_index')
      .eq('project_id', id)
      .order('order_index', { ascending: false })
      .limit(1);

    const maxOrder = existingImages?.[0]?.order_index ?? -1;

    const imageRecords = await Promise.all(
      newImages.map(async (file: File, index: number) => {
        const { url, path } = await uploadProjectImage(file, id);
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
};

export const deleteProject = async (projectId: string): Promise<void> => {
  const { data: images } = await (supabase as any)
    .from('project_images')
    .select('image_path')
    .eq('project_id', projectId);

  if (images && images.length > 0) {
    await Promise.all(
      images.map((img: any) => deleteProjectImageFromStorage(img.image_path))
    );
  }

  await (supabase as any)
    .from('project_images')
    .delete()
    .eq('project_id', projectId);

  const { error } = await (supabase as any)
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) throw error;
};

export const deleteProjectImage = async (imageId: string, imagePath: string): Promise<void> => {
  await deleteProjectImageFromStorage(imagePath);

  const { error } = await (supabase as any)
    .from('project_images')
    .delete()
    .eq('id', imageId);

  if (error) throw error;
};

export const reorderProjectImages = async (
  images: { id: string; order_index: number }[]
): Promise<void> => {
  await Promise.all(
    images.map((img) =>
      (supabase as any)
        .from('project_images')
        .update({ order_index: img.order_index })
        .eq('id', img.id)
    )
  );
};

export const reorderProjects = async (
  updates: { id: string; order_index: number }[]
): Promise<void> => {
  await Promise.all(
    updates.map((update) =>
      (supabase as any)
        .from('projects')
        .update({ order_index: update.order_index })
        .eq('id', update.id)
    )
  );
};
