// ============================================
// Legacy Hook: Re-exports from Model Layer
// For backward compatibility
// ============================================

export {
  useQuickActions,
  useAllQuickActions,
  useCreateQuickAction,
  useUpdateQuickAction,
  useDeleteQuickAction,
} from '@/models/quickActions';

export type { QuickAction } from '@/models/quickActions';
