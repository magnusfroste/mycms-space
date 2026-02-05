// ============================================
// Data Layer: Settings History
// Pure Supabase API calls - no UI logic
// ============================================

import { supabase } from '@/integrations/supabase/client';

export interface SettingsHistoryEntry {
  id: string;
  table_name: string;
  record_id: string;
  old_data: Record<string, unknown>;
  changed_at: string;
  changed_by: string | null;
}

// Table name to display label mapping
export const tableLabels: Record<string, string> = {
  modules: 'Modules',
  page_blocks: 'Page Blocks',
  nav_links: 'Navigation',
  blog_posts: 'Blog Posts',
  blog_categories: 'Blog Categories',
  github_repos: 'GitHub Repos',
  pages: 'Pages',
  newsletter_campaigns: 'Newsletters',
};

export const fetchSettingsHistory = async (
  limit = 50
): Promise<SettingsHistoryEntry[]> => {
  const { data, error } = await supabase
    .from('settings_history')
    .select('*')
    .order('changed_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching settings history:', error);
    throw error;
  }

  return (data || []) as SettingsHistoryEntry[];
};

export const fetchHistoryByTable = async (
  tableName: string,
  limit = 20
): Promise<SettingsHistoryEntry[]> => {
  const { data, error } = await supabase
    .from('settings_history')
    .select('*')
    .eq('table_name', tableName)
    .order('changed_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as SettingsHistoryEntry[];
};

export const fetchHistoryEntry = async (
  id: string
): Promise<SettingsHistoryEntry | null> => {
  const { data, error } = await supabase
    .from('settings_history')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching history entry:', error);
    return null;
  }

  return data as SettingsHistoryEntry;
};

// Supported tables for history restoration
// Must match tables that have triggers logging to settings_history
type RestorableTable = 
  | 'modules' 
  | 'page_blocks' 
  | 'nav_links'
  | 'blog_posts'
  | 'blog_categories'
  | 'github_repos'
  | 'pages'
  | 'newsletter_campaigns';

// Restore a specific history entry to its original table
export const restoreHistoryEntry = async (
  entry: SettingsHistoryEntry
): Promise<void> => {
  const { table_name, record_id, old_data } = entry;

  // Validate table name before attempting restore
  const validTables: RestorableTable[] = [
    'modules', 'page_blocks', 'nav_links', 'blog_posts', 
    'blog_categories', 'github_repos', 'pages', 'newsletter_campaigns'
  ];
  
  if (!validTables.includes(table_name as RestorableTable)) {
    throw new Error(`Cannot restore to unsupported table: ${table_name}`);
  }

  // Remove system fields that shouldn't be restored
  const { id, created_at, updated_at, ...restoreData } = old_data as Record<string, unknown>;

  const { error } = await supabase
    .from(table_name as RestorableTable)
    .update(restoreData)
    .eq('id', record_id);

  if (error) throw error;
};

// Realtime subscription helper
export const subscribeToSettingsHistory = (
  callback: () => void
): (() => void) => {
  const channel = supabase
    .channel('settings_history_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'settings_history',
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
