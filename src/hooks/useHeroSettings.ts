import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface HeroSettings {
  id: string;
  name: string;
  tagline: string;
  feature1: string;
  feature1_icon: string;
  feature2: string;
  feature2_icon: string;
  feature3: string;
  feature3_icon: string;
  enable_animations: boolean;
  animation_style: 'falling-stars' | 'particles' | 'gradient-shift' | 'none';
}

const defaultHeroSettings: Omit<HeroSettings, 'id'> = {
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

export const useHeroSettings = () => {
  const queryClient = useQueryClient();

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('hero_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hero_settings',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['hero-settings'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['hero-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_settings')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching hero settings:', error);
        return { ...defaultHeroSettings, id: '' } as HeroSettings;
      }
      
      return data as HeroSettings;
    },
  });
};

export const useUpdateHeroSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<HeroSettings>) => {
      const { data: existing } = await supabase
        .from('hero_settings')
        .select('id')
        .single();

      if (!existing) throw new Error('No settings found');

      const { data, error } = await supabase
        .from('hero_settings')
        .update(settings)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-settings'] });
    },
  });
};
