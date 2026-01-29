// ============================================
// Data Layer: Pages
// Pure Supabase API calls - no UI logic
// ============================================

import { supabase } from '@/integrations/supabase/client';
import type { Page, CreatePageInput, UpdatePageInput } from '@/types/pages';

export const fetchPages = async (): Promise<Page[]> => {
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .order('is_main_landing', { ascending: false })
    .order('title', { ascending: true });

  if (error) throw error;
  return data as Page[];
};

export const fetchEnabledPages = async (): Promise<Page[]> => {
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('enabled', true)
    .order('is_main_landing', { ascending: false })
    .order('title', { ascending: true });

  if (error) throw error;
  return data as Page[];
};

export const fetchPageBySlug = async (slug: string): Promise<Page | null> => {
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as Page;
};

export const fetchMainLandingPage = async (): Promise<Page | null> => {
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('is_main_landing', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as Page;
};

export const createPage = async (input: CreatePageInput): Promise<Page> => {
  // If this is the main landing, unset any existing main landing first
  if (input.is_main_landing) {
    await supabase
      .from('pages')
      .update({ is_main_landing: false })
      .eq('is_main_landing', true);
  }

  const { data, error } = await supabase
    .from('pages')
    .insert([input])
    .select()
    .single();

  if (error) throw error;
  return data as Page;
};

export const updatePage = async (input: UpdatePageInput): Promise<Page> => {
  const { id, ...updates } = input;

  // If setting as main landing, unset any existing main landing first
  if (updates.is_main_landing) {
    await supabase
      .from('pages')
      .update({ is_main_landing: false })
      .neq('id', id)
      .eq('is_main_landing', true);
  }

  const { data, error } = await supabase
    .from('pages')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Page;
};

export const deletePage = async (id: string): Promise<void> => {
  // First delete all blocks for this page
  const { data: page } = await supabase
    .from('pages')
    .select('slug')
    .eq('id', id)
    .single();

  if (page) {
    await supabase
      .from('page_blocks')
      .delete()
      .eq('page_slug', page.slug);
  }

  const { error } = await supabase
    .from('pages')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Subscribe to page changes
export const subscribeToPages = (callback: () => void): (() => void) => {
  const channel = supabase
    .channel('pages_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'pages' },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
