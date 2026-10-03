// ============================================
// Data Layer: Knowledge Base
// Markdown documents that ground the chat and MCP tools.
// Pure Supabase API calls - no UI logic
// ============================================

import { supabase } from '@/integrations/supabase/client';

export type KnowledgeVisibility = 'public' | 'private';

export interface KnowledgeDoc {
  id: string;
  slug: string;
  title: string;
  content: string;
  visibility: KnowledgeVisibility;
  order_index: number;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeDocVersion {
  id: string;
  doc_id: string | null;
  slug: string;
  title: string;
  content: string;
  visibility: KnowledgeVisibility;
  change_type: string;
  changed_by: string | null;
  created_at: string;
}

export interface KnowledgeDocInput {
  slug: string;
  title: string;
  content: string;
  visibility: KnowledgeVisibility;
  order_index?: number;
}

export const ADMIN_AUTHOR = 'admin';

export const slugify = (s: string): string =>
  s.toLowerCase().trim()
    .replace(/[åä]/g, 'a').replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    .slice(0, 80);

export const fetchKnowledgeDocs = async (): Promise<KnowledgeDoc[]> => {
  const { data, error } = await supabase
    .from('knowledge_docs')
    .select('*')
    .order('order_index')
    .order('title');
  if (error) throw error;
  return (data || []) as KnowledgeDoc[];
};

export const saveKnowledgeDoc = async (input: KnowledgeDocInput): Promise<KnowledgeDoc> => {
  const { data, error } = await supabase
    .from('knowledge_docs')
    .upsert({ ...input, updated_by: ADMIN_AUTHOR }, { onConflict: 'slug' })
    .select()
    .single();
  if (error) throw error;
  return data as KnowledgeDoc;
};

export const deleteKnowledgeDoc = async (id: string): Promise<void> => {
  // Stamp the author first so the history row records who deleted it.
  await supabase.from('knowledge_docs').update({ updated_by: ADMIN_AUTHOR }).eq('id', id);
  const { error } = await supabase.from('knowledge_docs').delete().eq('id', id);
  if (error) throw error;
};

export const fetchKnowledgeHistory = async (docId: string): Promise<KnowledgeDocVersion[]> => {
  const { data, error } = await supabase
    .from('knowledge_doc_versions')
    .select('*')
    .eq('doc_id', docId)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data || []) as KnowledgeDocVersion[];
};
