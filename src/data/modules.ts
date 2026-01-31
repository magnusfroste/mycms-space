// ============================================
// Data Layer: Modules
// Pure Supabase API calls - no UI logic
// ============================================

import { supabase } from '@/integrations/supabase/client';
import type { Module, ModuleType, ModuleConfigType } from '@/types/modules';

// Helper to cast response to Module type
const castModule = <T extends ModuleConfigType>(data: unknown): Module<T> => {
  const raw = data as Record<string, unknown>;
  return {
    id: raw.id as string,
    module_type: raw.module_type as ModuleType,
    module_config: (raw.module_config as T) || ({} as T),
    enabled: raw.enabled as boolean,
    created_at: raw.created_at as string | undefined,
    updated_at: raw.updated_at as string | undefined,
  };
};

export const fetchModule = async <T extends ModuleConfigType>(
  moduleType: ModuleType
): Promise<Module<T> | null> => {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('module_type', moduleType)
    .maybeSingle();

  if (error) {
    console.error('Error fetching module:', error);
    throw error;
  }

  return data ? castModule<T>(data) : null;
};

export const fetchAllModules = async (): Promise<Module[]> => {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .order('module_type');

  if (error) {
    console.error('Error fetching all modules:', error);
    throw error;
  }

  return (data || []).map((d) => castModule(d));
};

export const updateModule = async <T extends ModuleConfigType>(
  moduleType: ModuleType,
  updates: Partial<{ enabled: boolean; module_config: T }>
): Promise<Module<T>> => {
  const { data, error } = await supabase
    .from('modules')
    .update(updates as never)
    .eq('module_type', moduleType)
    .select()
    .single();

  if (error) {
    console.error('Error updating module:', error);
    throw error;
  }

  return castModule<T>(data);
};

export const createModule = async <T extends ModuleConfigType>(
  moduleType: ModuleType,
  config: T,
  enabled = true
): Promise<Module<T>> => {
  const { data, error } = await supabase
    .from('modules')
    .insert({
      module_type: moduleType,
      module_config: config,
      enabled,
    } as never)
    .select()
    .single();

  if (error) {
    console.error('Error creating module:', error);
    throw error;
  }

  return castModule<T>(data);
};

// Realtime subscription helper
export const subscribeToModule = (
  moduleType: ModuleType,
  callback: () => void
): (() => void) => {
  const channel = supabase
    .channel(`module_${moduleType}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'modules',
        filter: `module_type=eq.${moduleType}`,
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
