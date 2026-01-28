// ============================================
// Data Layer: About Me Settings
// Pure Supabase API calls - no UI logic
// ============================================

import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/utils/imageCompression';
import type { AboutMeSettings, UpdateAboutMeInput } from '@/types';

// Storage operations
export const uploadAboutMeImage = async (
  file: File
): Promise<{ url: string; path: string }> => {
  const compressedFile = await compressImage(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1024,
  });

  const fileExt = compressedFile.name.split('.').pop();
  const fileName = `about-me-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('about-me-images')
    .upload(fileName, compressedFile, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('about-me-images')
    .getPublicUrl(fileName);

  return { url: publicUrl, path: fileName };
};

export const deleteAboutMeImage = async (path: string): Promise<void> => {
  const { error } = await supabase.storage
    .from('about-me-images')
    .remove([path]);

  if (error) throw error;
};

// Database operations
export const fetchAboutMeSettings = async (): Promise<AboutMeSettings | null> => {
  const { data, error } = await supabase
    .from('about_me_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as AboutMeSettings | null;
};

export const updateAboutMeSettings = async (
  input: UpdateAboutMeInput
): Promise<AboutMeSettings> => {
  const { image, image_url, image_path, ...updateData } = input;

  const { data: existing } = await supabase
    .from('about_me_settings')
    .select('id, image_path')
    .limit(1)
    .maybeSingle();

  let finalImageUrl: string | undefined = image_url;
  let finalImagePath: string | undefined = image_path;

  // Handle File upload (legacy flow)
  if (image) {
    if (existing?.image_path) {
      try {
        await deleteAboutMeImage(existing.image_path);
      } catch (error) {
        console.error('Error deleting old image:', error);
      }
    }

    const result = await uploadAboutMeImage(image);
    finalImageUrl = result.url;
    finalImagePath = result.path;
  }

  const dataToSave = {
    ...updateData,
    ...(finalImageUrl !== undefined && { image_url: finalImageUrl }),
    ...(finalImagePath !== undefined && { image_path: finalImagePath }),
  };

  if (existing) {
    const { data, error } = await supabase
      .from('about_me_settings')
      .update(dataToSave)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data as AboutMeSettings;
  } else {
    const { data, error } = await supabase
      .from('about_me_settings')
      .insert(dataToSave)
      .select()
      .single();

    if (error) throw error;
    return data as AboutMeSettings;
  }
};

// Realtime subscription helper
export const subscribeToAboutMeSettings = (
  callback: () => void
): (() => void) => {
  const channel = supabase
    .channel('about_me_settings_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'about_me_settings',
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
