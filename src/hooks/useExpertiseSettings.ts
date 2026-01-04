// ============================================
// Legacy Hook: Re-exports from Model Layer
// For backward compatibility
// ============================================

export {
  useExpertiseAreas,
  useCreateExpertiseArea,
  useUpdateExpertiseArea,
  useDeleteExpertiseArea,
  useExpertiseAreasSubscription,
} from '@/models/expertise';

export type { ExpertiseArea } from '@/models/expertise';
