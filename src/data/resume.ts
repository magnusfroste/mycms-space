// ============================================
// Data Layer: Resume Entries
// Pure Supabase API calls - no UI logic
// ============================================

import { supabase } from '@/integrations/supabase/client';

export interface ResumeEntry {
  id: string;
  category: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  tags: string[];
  metadata: Record<string, unknown>;
  order_index: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type ResumeEntryInsert = Omit<ResumeEntry, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

const castEntry = (data: unknown): ResumeEntry => data as ResumeEntry;

export const fetchResumeEntries = async (category?: string): Promise<ResumeEntry[]> => {
  let query = supabase
    .from('resume_entries' as never)
    .select('*')
    .order('order_index');

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching resume entries:', error);
    throw error;
  }
  return (data || []).map(castEntry);
};

export const createResumeEntry = async (entry: ResumeEntryInsert): Promise<ResumeEntry> => {
  const { data, error } = await supabase
    .from('resume_entries' as never)
    .insert(entry as never)
    .select()
    .single();

  if (error) {
    console.error('Error creating resume entry:', error);
    throw error;
  }
  return castEntry(data);
};

export const updateResumeEntry = async (id: string, updates: Partial<ResumeEntry>): Promise<ResumeEntry> => {
  const { data, error } = await supabase
    .from('resume_entries' as never)
    .update({ ...updates, updated_at: new Date().toISOString() } as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating resume entry:', error);
    throw error;
  }
  return castEntry(data);
};

export const deleteResumeEntry = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('resume_entries' as never)
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting resume entry:', error);
    throw error;
  }
};
