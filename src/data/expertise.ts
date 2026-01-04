// ============================================
// Data Layer: Expertise Areas
// Pure Supabase API calls - no UI logic
// ============================================

import { supabase } from '@/integrations/supabase/client';
import type { ExpertiseArea } from '@/types';

export const fetchExpertiseAreas = async (): Promise<ExpertiseArea[]> => {
  const { data, error } = await supabase
    .from('expertise_areas')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data as ExpertiseArea[];
};

export const createExpertiseArea = async (
  newArea: Omit<ExpertiseArea, 'id' | 'created_at' | 'updated_at'>
): Promise<ExpertiseArea> => {
  const { data, error } = await supabase
    .from('expertise_areas')
    .insert([newArea])
    .select()
    .single();

  if (error) throw error;
  return data as ExpertiseArea;
};

export const updateExpertiseArea = async (
  id: string,
  updates: Partial<ExpertiseArea>
): Promise<ExpertiseArea> => {
  const { data, error } = await supabase
    .from('expertise_areas')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ExpertiseArea;
};

export const deleteExpertiseArea = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('expertise_areas')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Realtime subscription helper
export const subscribeToExpertiseAreas = (
  callback: () => void
): (() => void) => {
  const channel = supabase
    .channel('expertise_areas_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'expertise_areas',
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
