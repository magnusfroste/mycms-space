// ============================================
// Data Layer: Categories
// Pure Supabase API calls - no UI logic
// ============================================

import { supabase } from '@/integrations/supabase/client';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@/types';

// Fetch all enabled categories (for public display)
export const fetchCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('enabled', true)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data || [];
};

// Fetch all categories including disabled (for admin)
export const fetchAllCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
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

// Create a new category
export const createCategory = async (
  input: CreateCategoryInput
): Promise<Category> => {
  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: input.name,
      slug: input.slug,
      order_index: input.order_index,
      enabled: input.enabled ?? true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update an existing category
export const updateCategory = async (
  input: UpdateCategoryInput
): Promise<Category> => {
  const { id, ...updates } = input;
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete a category
export const deleteCategory = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Reorder categories
export const reorderCategories = async (
  orderedIds: string[]
): Promise<void> => {
  const updates = orderedIds.map((id, index) => ({
    id,
    order_index: index,
  }));

  for (const update of updates) {
    const { error } = await supabase
      .from('categories')
      .update({ order_index: update.order_index })
      .eq('id', update.id);

    if (error) throw error;
  }
};
