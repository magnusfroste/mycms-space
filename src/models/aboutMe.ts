// ============================================
// Model Layer: About Me Settings
// Business logic, React Query hooks
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import * as aboutMeData from '@/data/aboutMe';
import type { AboutMeSettings, UpdateAboutMeInput } from '@/types';

// Re-export types
export type { AboutMeSettings, UpdateAboutMeInput };

// Default values
export const DEFAULT_ABOUT_ME_SETTINGS: Omit<AboutMeSettings, 'id' | 'created_at' | 'updated_at'> = {
  name: 'Magnus Froste',
  intro_text: "As a seasoned technology leader and innovator, I've dedicated my career to helping organizations navigate the rapidly evolving tech landscape. My passion lies in identifying transformative opportunities at the intersection of business and technology.",
  additional_text: 'With extensive experience in business and product development, I excel at turning complex ideas into tangible solutions. My approach combines strategic thinking with hands-on technical expertise, ensuring that innovation translates directly into business value.',
  skill1_title: 'Technology Leadership',
  skill1_description: 'Proven track record as CTO leading teams and implementing cutting-edge technology solutions loved by customers.',
  skill1_icon: 'Monitor',
  skill2_title: 'Product Strategy & Business Development',
  skill2_description: '20+ years of experience from innovating new product & services and product management, driving successful market launches across different sectors.',
  skill2_icon: 'Rocket',
  skill3_title: 'AI Innovation',
  skill3_description: 'Generative AI specialist with a wide range of experience developing AI Agents, RAG solutions, local AI deployments, generative AI libraries/packages, and more.',
  skill3_icon: 'Brain',
  image_url: '',
};

// Query keys
export const aboutMeKeys = {
  settings: ['aboutMeSettings'] as const,
};

// Fetch about me settings with realtime subscription
export const useAboutMeSettings = () => {
  const queryClient = useQueryClient();

  // Subscribe to realtime updates
  useEffect(() => {
    const unsubscribe = aboutMeData.subscribeToAboutMeSettings(() => {
      queryClient.invalidateQueries({ queryKey: aboutMeKeys.settings });
    });

    return unsubscribe;
  }, [queryClient]);

  return useQuery({
    queryKey: aboutMeKeys.settings,
    queryFn: async () => {
      const data = await aboutMeData.fetchAboutMeSettings();
      return data || {
        ...DEFAULT_ABOUT_ME_SETTINGS,
        id: 'default',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    },
  });
};

// Update about me settings
export const useUpdateAboutMeSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: aboutMeData.updateAboutMeSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aboutMeKeys.settings });
    },
  });
};
