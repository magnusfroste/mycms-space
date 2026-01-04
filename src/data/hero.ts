// ============================================
// Data Layer: Hero Settings
// Pure Supabase API calls - no UI logic
// ============================================

import { supabase } from '@/integrations/supabase/client';
import type { HeroSettings } from '@/types';

export const fetchHeroSettings = async (): Promise<HeroSettings | null> => {
  const { data, error } = await supabase
    .from('hero_settings')
    .select('*')
    .single();

  if (error) {
    console.error('Error fetching hero settings:', error);
    return null;
  }

  return data as HeroSettings;
};

export const updateHeroSettings = async (
  settings: Partial<HeroSettings>
): Promise<HeroSettings> => {
  const { data: existing } = await supabase
    .from('hero_settings')
    .select('id')
    .single();

  if (!existing) throw new Error('No settings found');

  const { data, error } = await supabase
    .from('hero_settings')
    .update(settings)
    .eq('id', existing.id)
    .select()
    .single();

  if (error) throw error;
  return data as HeroSettings;
};

// Realtime subscription helper
export const subscribeToHeroSettings = (
  callback: () => void
): (() => void) => {
  const channel = supabase
    .channel('hero_settings_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'hero_settings',
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
