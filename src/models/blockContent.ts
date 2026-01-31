// ============================================
// Model Layer: Block Content
// Unified model for reading/updating block_config JSONB
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { PageBlock, BlockType } from '@/types';
import type { BlockConfigType, BlockTypeConfigMap, ConfigForBlockType } from '@/types/blockConfigs';
import type { Json } from '@/integrations/supabase/types';

// Query keys
export const blockContentKeys = {
  all: ['block-content'] as const,
  byPage: (pageSlug: string) => ['block-content', 'page', pageSlug] as const,
  byId: (blockId: string) => ['block-content', 'block', blockId] as const,
  byType: (blockType: BlockType) => ['block-content', 'type', blockType] as const,
};

// Fetch all blocks for a page
export const usePageBlocks = (pageSlug: string) => {
  return useQuery({
    queryKey: blockContentKeys.byPage(pageSlug),
    queryFn: async (): Promise<PageBlock[]> => {
      const { data, error } = await supabase
        .from('page_blocks')
        .select('*')
        .eq('page_slug', pageSlug)
        .eq('enabled', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as PageBlock[];
    },
  });
};

// Fetch a single block by ID
export const useBlockContent = <T extends BlockType>(blockId: string) => {
  return useQuery({
    queryKey: blockContentKeys.byId(blockId),
    queryFn: async (): Promise<PageBlock & { block_config: ConfigForBlockType<T> }> => {
      const { data, error } = await supabase
        .from('page_blocks')
        .select('*')
        .eq('id', blockId)
        .single();

      if (error) throw error;
      return data as PageBlock & { block_config: ConfigForBlockType<T> };
    },
    enabled: !!blockId,
  });
};

// Fetch first block of a type on a page (useful for singleton blocks like hero)
export const useBlockByType = <T extends keyof BlockTypeConfigMap>(
  pageSlug: string,
  blockType: T
) => {
  return useQuery({
    queryKey: [...blockContentKeys.byPage(pageSlug), blockType],
    queryFn: async (): Promise<(PageBlock & { block_config: BlockTypeConfigMap[T] }) | null> => {
      const { data, error } = await supabase
        .from('page_blocks')
        .select('*')
        .eq('page_slug', pageSlug)
        .eq('block_type', blockType)
        .eq('enabled', true)
        .order('order_index', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as (PageBlock & { block_config: BlockTypeConfigMap[T] }) | null;
    },
  });
};

// Update block config
export const useUpdateBlockConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      blockId,
      config,
    }: {
      blockId: string;
      config: Partial<BlockConfigType>;
    }) => {
      // First get the current block config
      const { data: currentBlock, error: fetchError } = await supabase
        .from('page_blocks')
        .select('block_config')
        .eq('id', blockId)
        .single();

      if (fetchError) throw fetchError;

      // Merge with existing config
      const mergedConfig = {
        ...(currentBlock?.block_config as Record<string, unknown> || {}),
        ...config,
      };

      const { data, error } = await supabase
        .from('page_blocks')
        .update({ block_config: mergedConfig })
        .eq('id', blockId)
        .select()
        .single();

      if (error) throw error;
      return data as PageBlock;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: blockContentKeys.byId(data.id) });
      queryClient.invalidateQueries({ queryKey: blockContentKeys.byPage(data.page_slug) });
    },
  });
};

// Replace entire block config (useful for full rewrites)
export const useReplaceBlockConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      blockId,
      config,
    }: {
      blockId: string;
      config: BlockConfigType;
    }) => {
      const { data, error } = await supabase
        .from('page_blocks')
        .update({ block_config: config as Json })
        .eq('id', blockId)
        .select()
        .single();

      if (error) throw error;
      return data as PageBlock;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: blockContentKeys.byId(data.id) });
      queryClient.invalidateQueries({ queryKey: blockContentKeys.byPage(data.page_slug) });
    },
  });
};

// Subscribe to realtime updates for a page's blocks
export const useBlockContentSubscription = (pageSlug: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
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
        () => {
          queryClient.invalidateQueries({ queryKey: blockContentKeys.byPage(pageSlug) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pageSlug, queryClient]);
};

// Helper to extract typed config from a block
export function getTypedConfig<T extends keyof BlockTypeConfigMap>(
  block: PageBlock | null | undefined,
  _blockType: T
): BlockTypeConfigMap[T] | null {
  if (!block) return null;
  return block.block_config as BlockTypeConfigMap[T];
}
