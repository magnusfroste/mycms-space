// ============================================
// Data Layer: Portfolio Settings
// Pure Supabase API calls - no UI logic
// ============================================

import { supabase } from '@/integrations/supabase/client';
import type { PortfolioSettings } from '@/types';

export const fetchPortfolioSettings = async (): Promise<PortfolioSettings | null> => {
  const { data, error } = await supabase
    .from('portfolio_settings')
    .select('*')
    .single();

  if (error) {
    console.error('Error fetching portfolio settings:', error);
    return null;
  }

  return data as PortfolioSettings;
};

export const updatePortfolioSettings = async (
  settings: Partial<PortfolioSettings>
): Promise<void> => {
  const { data: existing } = await supabase
    .from('portfolio_settings')
    .select('id')
    .single();

  if (!existing) {
    const { error } = await supabase
      .from('portfolio_settings')
      .insert(settings);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('portfolio_settings')
      .update(settings)
      .eq('id', existing.id);
    if (error) throw error;
  }
};
