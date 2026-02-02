// ============================================
// SEO Module Hook
// Fetch and manage SEO module settings
// ============================================

import { useQuery } from '@tanstack/react-query';
import { fetchModule } from '@/data/modules';
import type { SEOModuleConfig } from '@/types/modules';
import { defaultModuleConfigs } from '@/types/modules';

export const useSEOModule = () => {
  return useQuery({
    queryKey: ['module', 'seo'],
    queryFn: () => fetchModule<SEOModuleConfig>('seo'),
    select: (data) => ({
      ...data,
      module_config: data?.module_config || defaultModuleConfigs.seo,
    }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
