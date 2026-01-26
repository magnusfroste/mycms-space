// ============================================
// Data Layer: Featured Items
// Pure Supabase API calls - no UI logic
// ============================================

import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/utils/imageCompression';
import type { FeaturedItem } from '@/types';

// Storage operations
export const uploadFeaturedImage = async (
  file: File,
  itemId: string
): Promise<{ url: string; path: string }> => {
  const compressedFile = await compressImage(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 800,
  });

  const fileExt = compressedFile.name.split('.').pop();
  const filePath = `${itemId}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('featured-images')
    .upload(filePath, compressedFile, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('featured-images')
    .getPublicUrl(filePath);

  return { url: publicUrl, path: filePath };
};

export const deleteFeaturedImage = async (path: string): Promise<void> => {
  await supabase.storage.from('featured-images').remove([path]);
};

// Database operations
export const fetchFeaturedItems = async (): Promise<FeaturedItem[]> => {
  const { data, error } = await supabase
    .from('featured_in')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data as FeaturedItem[];
};

export const createFeaturedItem = async (input: {
  file?: File | null;
  title: string;
  description: string;
  enabled: boolean;
  image_url?: string | null;
  image_path?: string | null;
}): Promise<FeaturedItem> => {
  const { data: existingItems } = await supabase
    .from('featured_in')
    .select('order_index')
    .order('order_index', { ascending: false })
    .limit(1);

  const nextOrderIndex = existingItems?.[0]?.order_index
    ? existingItems[0].order_index + 1
    : 1;

  let image_url = input.image_url ?? null;
  let image_path = input.image_path ?? null;

  if (input.file) {
    const itemId = crypto.randomUUID();
    const result = await uploadFeaturedImage(input.file, itemId);
    image_url = result.url;
    image_path = result.path;
  }

  const { data, error } = await supabase
    .from('featured_in')
    .insert({
      title: input.title,
      description: input.description,
      image_url,
      image_path,
      order_index: nextOrderIndex,
      enabled: input.enabled,
    })
    .select()
    .single();

  if (error) throw error;
  return data as FeaturedItem;
};

export const updateFeaturedItem = async (input: {
  id: string;
  file?: File | null;
  title?: string;
  description?: string;
  enabled?: boolean;
  image_url?: string | null;
  image_path?: string | null;
  oldImagePath?: string | null;
}): Promise<FeaturedItem> => {
  const updateData: Record<string, unknown> = {};

  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.enabled !== undefined) updateData.enabled = input.enabled;

  // Handle file upload
  if (input.file) {
    if (input.oldImagePath) {
      await deleteFeaturedImage(input.oldImagePath);
    }
    const result = await uploadFeaturedImage(input.file, input.id);
    updateData.image_url = result.url;
    updateData.image_path = result.path;
  } else if (input.image_url !== undefined) {
    // Direct URL update (from ImageUpload component)
    updateData.image_url = input.image_url;
    updateData.image_path = input.image_path;
  }

  const { data, error } = await supabase
    .from('featured_in')
    .update(updateData)
    .eq('id', input.id)
    .select()
    .single();

  if (error) throw error;
  return data as FeaturedItem;
};

export const deleteFeaturedItem = async (
  id: string,
  imagePath: string | null
): Promise<void> => {
  if (imagePath) {
    await deleteFeaturedImage(imagePath);
  }

  const { error } = await supabase
    .from('featured_in')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const reorderFeaturedItem = async (
  id: string,
  newOrderIndex: number
): Promise<void> => {
  const { error } = await supabase
    .from('featured_in')
    .update({ order_index: newOrderIndex })
    .eq('id', id);

  if (error) throw error;
};
