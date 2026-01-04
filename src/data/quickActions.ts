// ============================================
// Data Layer: Quick Actions
// Pure Supabase API calls - no UI logic
// ============================================

import { supabase } from '@/integrations/supabase/client';
import type { QuickAction } from '@/types';

export const fetchQuickActions = async (
  enabledOnly: boolean = true
): Promise<QuickAction[]> => {
  let query = supabase
    .from('quick_actions')
    .select('*')
    .order('order_index', { ascending: true });

  if (enabledOnly) {
    query = query.eq('enabled', true);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as QuickAction[];
};

export const createQuickAction = async (
  action: Omit<QuickAction, 'id'>
): Promise<QuickAction> => {
  const { data, error } = await supabase
    .from('quick_actions')
    .insert([action])
    .select()
    .single();

  if (error) throw error;
  return data as QuickAction;
};

export const updateQuickAction = async (
  id: string,
  updates: Partial<QuickAction>
): Promise<QuickAction> => {
  const { data, error } = await supabase
    .from('quick_actions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as QuickAction;
};

export const deleteQuickAction = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('quick_actions')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
