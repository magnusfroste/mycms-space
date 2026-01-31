// ============================================
// Data Layer: AI Module
// Pure Supabase API calls - no UI logic
// ============================================

import { supabase } from '@/integrations/supabase/client';
import type { AIModuleSettings } from '@/types';

export const fetchAIModuleSettings = async (): Promise<AIModuleSettings | null> => {
  const { data, error } = await supabase
    .from('ai_module')
    .select('*')
    .single();

  if (error) {
    console.error('Error fetching AI module settings:', error);
    return null;
  }

  return data as AIModuleSettings;
};

export const updateAIModuleSettings = async (
  settings: Partial<AIModuleSettings>
): Promise<AIModuleSettings> => {
  const { data: existing } = await supabase
    .from('ai_module')
    .select('id')
    .single();

  if (!existing) throw new Error('No AI module settings found');

  const { data, error } = await supabase
    .from('ai_module')
    .update(settings)
    .eq('id', existing.id)
    .select()
    .single();

  if (error) throw error;
  return data as AIModuleSettings;
};
