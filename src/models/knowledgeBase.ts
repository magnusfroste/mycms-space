// ============================================
// Model Layer: Knowledge Base
// React Query hooks
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as kbData from '@/data/knowledgeBase';
import type { KnowledgeDoc, KnowledgeDocInput, KnowledgeDocVersion, KnowledgeVisibility } from '@/data/knowledgeBase';

export type { KnowledgeDoc, KnowledgeDocInput, KnowledgeDocVersion, KnowledgeVisibility };
export { slugify } from '@/data/knowledgeBase';

export const kbKeys = {
  all: ['knowledge-docs'] as const,
  history: (docId: string) => ['knowledge-docs', 'history', docId] as const,
};

export const useKnowledgeDocs = () =>
  useQuery({ queryKey: kbKeys.all, queryFn: kbData.fetchKnowledgeDocs });

export const useKnowledgeHistory = (docId: string | null) =>
  useQuery({
    queryKey: kbKeys.history(docId || 'none'),
    queryFn: () => kbData.fetchKnowledgeHistory(docId as string),
    enabled: !!docId,
  });

export const useSaveKnowledgeDoc = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: KnowledgeDocInput) => kbData.saveKnowledgeDoc(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: kbKeys.all }),
  });
};

export const useDeleteKnowledgeDoc = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => kbData.deleteKnowledgeDoc(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: kbKeys.all }),
  });
};

/** Rough size estimate shown to the owner (the chat reads the whole knowledge base). */
export const estimateWords = (docs: KnowledgeDoc[]) =>
  docs.reduce((sum, d) => sum + d.content.split(/\s+/).filter(Boolean).length, 0);
