// ============================================
// Model Layer: Resume
// React Query hooks + business logic
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as resumeData from '@/data/resume';
import type { ResumeEntry, ResumeEntryInsert } from '@/data/resume';

export type { ResumeEntry, ResumeEntryInsert };

export const resumeKeys = {
  all: ['resume-entries'] as const,
  byCategory: (cat: string) => ['resume-entries', cat] as const,
};

export const useResumeEntries = (category?: string) => {
  return useQuery({
    queryKey: category ? resumeKeys.byCategory(category) : resumeKeys.all,
    queryFn: () => resumeData.fetchResumeEntries(category),
  });
};

export const useCreateResumeEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entry: ResumeEntryInsert) => resumeData.createResumeEntry(entry),
    onSuccess: () => qc.invalidateQueries({ queryKey: resumeKeys.all }),
  });
};

export const useUpdateResumeEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ResumeEntry> }) =>
      resumeData.updateResumeEntry(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: resumeKeys.all }),
  });
};

export const useDeleteResumeEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resumeData.deleteResumeEntry(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: resumeKeys.all }),
  });
};

// Convenience: group entries by category
export const useGroupedResumeEntries = () => {
  const { data: entries = [], ...rest } = useResumeEntries();

  const grouped = entries.reduce<Record<string, ResumeEntry[]>>((acc, entry) => {
    if (!acc[entry.category]) acc[entry.category] = [];
    acc[entry.category].push(entry);
    return acc;
  }, {});

  return { grouped, entries, ...rest };
};
