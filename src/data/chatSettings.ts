// ============================================
// Data Layer: Chat Settings
// Pure Supabase API calls - no UI logic
// ============================================

import { supabase } from '@/integrations/supabase/client';
import type { ChatSettings } from '@/types';

export const fetchChatSettings = async (): Promise<ChatSettings | null> => {
  const { data, error } = await supabase
    .from('chat_settings')
    .select('*')
    .single();

  if (error) {
    console.error('Error fetching chat settings:', error);
    return null;
  }

  return data as ChatSettings;
};

export const updateChatSettings = async (
  settings: Partial<ChatSettings>
): Promise<ChatSettings> => {
  const { data: existing } = await supabase
    .from('chat_settings')
    .select('id')
    .single();

  if (!existing) throw new Error('No settings found');

  const { data, error } = await supabase
    .from('chat_settings')
    .update(settings)
    .eq('id', existing.id)
    .select()
    .single();

  if (error) throw error;
  return data as ChatSettings;
};
