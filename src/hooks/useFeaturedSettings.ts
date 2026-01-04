// ============================================
// Legacy Hook: Re-exports from Model Layer
// For backward compatibility
// ============================================

export {
  useFeaturedItems,
  useCreateFeaturedItem,
  useUpdateFeaturedItem,
  useDeleteFeaturedItem,
  useReorderFeaturedItem,
} from '@/models/featured';

export type { FeaturedItem } from '@/models/featured';
