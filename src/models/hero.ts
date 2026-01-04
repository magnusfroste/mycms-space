// ============================================
// Model Layer: Hero Settings
// Business logic, React Query hooks
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import * as heroData from '@/data/hero';
import type { HeroSettings } from '@/types';

// Re-export types
export type { HeroSettings };

// Default values
export const defaultHeroSettings: Omit<HeroSettings, 'id'> = {
  name: 'Magnus Froste',
  tagline: 'Innovation Strategist & AI Integration Expert',
  feature1: 'Innovation',
  feature1_icon: 'Rocket',
  feature2: 'Strategy',
  feature2_icon: 'BarChart',
  feature3: 'AI Integration',
  feature3_icon: 'Brain',
  enable_animations: true,
  animation_style: 'falling-stars',
};

// Query keys
export const heroKeys = {
  settings: ['hero-settings'] as const,
};

// Fetch hero settings with realtime subscription
export const useHeroSettings = () => {
  const queryClient = useQueryClient();

  // Subscribe to realtime updates
  useEffect(() => {
    const unsubscribe = heroData.subscribeToHeroSettings(() => {
      queryClient.invalidateQueries({ queryKey: heroKeys.settings });
    });

    return unsubscribe;
  }, [queryClient]);

  return useQuery({
    queryKey: heroKeys.settings,
    queryFn: async () => {
      const data = await heroData.fetchHeroSettings();
      return data || ({ ...defaultHeroSettings, id: '' } as HeroSettings);
    },
  });
};

// Update hero settings
export const useUpdateHeroSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: heroData.updateHeroSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heroKeys.settings });
    },
  });
};
