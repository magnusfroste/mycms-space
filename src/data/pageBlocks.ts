// ============================================
// Data Layer: Page Blocks
// Pure Supabase API calls - no UI logic
// ============================================

import { supabase } from '@/integrations/supabase/client';
import type { PageBlock, CreatePageBlockInput, UpdatePageBlockInput, BlockType } from '@/types';

// Helper to cast block_type from string to BlockType
const castBlockType = (data: unknown): PageBlock => {
  const raw = data as Record<string, unknown>;
  return {
    ...raw,
    block_type: raw.block_type as BlockType,
    block_config: (raw.block_config as Record<string, unknown>) || {},
  } as PageBlock;
};

export const fetchPageBlocks = async (pageSlug: string): Promise<PageBlock[]> => {
  const { data, error } = await supabase
    .from('page_blocks')
    .select('*')
    .eq('page_slug', pageSlug)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching page blocks:', error);
    throw error;
  }

  return (data || []).map(castBlockType);
};

export const fetchAllPageBlocks = async (): Promise<PageBlock[]> => {
  const { data, error } = await supabase
    .from('page_blocks')
    .select('*')
    .order('page_slug')
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching all page blocks:', error);
    throw error;
  }

  return (data || []).map(castBlockType);
};

export const createPageBlock = async (input: CreatePageBlockInput): Promise<PageBlock> => {
  const insertData = {
    page_slug: input.page_slug,
    block_type: input.block_type,
    block_config: input.block_config || {},
    order_index: input.order_index,
    enabled: input.enabled ?? true,
  };

  const { data, error } = await supabase
    .from('page_blocks')
    .insert(insertData as never)
    .select()
    .single();

  if (error) throw error;
  return castBlockType(data);
};

export const updatePageBlock = async (input: UpdatePageBlockInput): Promise<PageBlock> => {
  const updateData: Record<string, unknown> = {};
  
  if (input.block_type !== undefined) updateData.block_type = input.block_type;
  if (input.block_config !== undefined) updateData.block_config = input.block_config;
  if (input.order_index !== undefined) updateData.order_index = input.order_index;
  if (input.enabled !== undefined) updateData.enabled = input.enabled;

  const { data, error } = await supabase
    .from('page_blocks')
    .update(updateData)
    .eq('id', input.id)
    .select()
    .single();

  if (error) throw error;
  return castBlockType(data);
};

export const deletePageBlock = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('page_blocks')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const reorderPageBlocks = async (
  blocks: { id: string; order_index: number }[]
): Promise<void> => {
  // Update each block's order_index
  const updates = blocks.map(({ id, order_index }) =>
    supabase
      .from('page_blocks')
      .update({ order_index })
      .eq('id', id)
  );

  const results = await Promise.all(updates);
  const errors = results.filter((r) => r.error);
  
  if (errors.length > 0) {
    throw errors[0].error;
  }
};

// Realtime subscription helper
export const subscribeToPageBlocks = (
  pageSlug: string,
  callback: () => void
): (() => void) => {
  const channel = supabase
    .channel(`page_blocks_${pageSlug}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'page_blocks',
        filter: `page_slug=eq.${pageSlug}`,
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
