// ============================================
// Data Layer: Categories
// Pure Supabase API calls - no UI logic
// ============================================

import { supabase } from '@/integrations/supabase/client';
import type { Category } from '@/types';

export const fetchCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('enabled', true)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const fetchProjectCategories = async (
  projectId: string
): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('project_categories')
    .select('category_id, categories(*)')
    .eq('project_id', projectId);

  if (error) throw error;
  return data?.map((pc: any) => pc.categories).filter(Boolean) || [];
};

export const updateProjectCategories = async (
  projectId: string,
  categoryIds: string[]
): Promise<void> => {
  // Delete existing associations
  await supabase
    .from('project_categories')
    .delete()
    .eq('project_id', projectId);

  // Insert new associations
  if (categoryIds.length > 0) {
    const { error } = await supabase
      .from('project_categories')
      .insert(
        categoryIds.map(categoryId => ({
          project_id: projectId,
          category_id: categoryId,
        }))
      );

    if (error) throw error;
  }
};
