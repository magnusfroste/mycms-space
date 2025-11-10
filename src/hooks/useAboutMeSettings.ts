import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface AboutMeSettings {
  id: string;
  name: string;
  intro_text: string;
  additional_text: string;
  skill1_title: string;
  skill1_description: string;
  skill1_icon: string;
  skill2_title: string;
  skill2_description: string;
  skill2_icon: string;
  skill3_title: string;
  skill3_description: string;
  skill3_icon: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

const DEFAULT_SETTINGS: Omit<AboutMeSettings, 'id' | 'created_at' | 'updated_at'> = {
  name: 'Magnus Froste',
  intro_text: 'As a seasoned technology leader and innovator, I\'ve dedicated my career to helping organizations navigate the rapidly evolving tech landscape. My passion lies in identifying transformative opportunities at the intersection of business and technology.',
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

export const useAboutMeSettings = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['aboutMeSettings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('about_me_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      // Return data or default settings
      return data || {
        ...DEFAULT_SETTINGS,
        id: 'default',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('about_me_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'about_me_settings',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['aboutMeSettings'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
};

export const useUpdateAboutMeSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<AboutMeSettings>) => {
      // Check if a record exists
      const { data: existing } = await supabase
        .from('about_me_settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (existing) {
        // Update existing record
        const { data, error } = await supabase
          .from('about_me_settings')
          .update(settings)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('about_me_settings')
          .insert(settings)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aboutMeSettings'] });
    },
  });
};
