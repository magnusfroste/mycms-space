// ============================================
// Legacy Hook: Re-exports from Model Layer
// For backward compatibility
// ============================================

export {
  useCategories,
  useAllCategories,
  useProjectCategories,
  useUpdateProjectCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useReorderCategories,
} from '@/models/categories';

export type { Category, CreateCategoryInput, UpdateCategoryInput } from '@/models/categories';
