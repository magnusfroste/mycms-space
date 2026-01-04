// ============================================
// Data Layer: Nav Links
// Pure Supabase API calls - no UI logic
// ============================================

import { supabase } from '@/integrations/supabase/client';
import type { NavLink, CreateNavLinkInput, UpdateNavLinkInput } from '@/types';

export const fetchNavLinks = async (): Promise<NavLink[]> => {
  const { data, error } = await supabase
    .from('nav_links')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data as NavLink[];
};

export const fetchAllNavLinks = async (): Promise<NavLink[]> => {
  const { data, error } = await supabase
    .from('nav_links')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data as NavLink[];
};

export const createNavLink = async (input: CreateNavLinkInput): Promise<NavLink> => {
  const { data, error } = await supabase
    .from('nav_links')
    .insert([input])
    .select()
    .single();

  if (error) throw error;
  return data as NavLink;
};

export const updateNavLink = async (
  id: string,
  updates: Partial<Omit<NavLink, 'id' | 'created_at' | 'updated_at'>>
): Promise<NavLink> => {
  const { data, error } = await supabase
    .from('nav_links')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as NavLink;
};

export const deleteNavLink = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('nav_links')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const reorderNavLinks = async (
  updates: { id: string; order_index: number }[]
): Promise<void> => {
  const promises = updates.map(({ id, order_index }) =>
    supabase.from('nav_links').update({ order_index }).eq('id', id)
  );
  const results = await Promise.all(promises);
  const error = results.find((r) => r.error)?.error;
  if (error) throw error;
};
