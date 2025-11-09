import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ChatSettings {
  id: string;
  webhook_url: string;
  initial_placeholder: string;
  active_placeholder: string;
}

export const useChatSettings = () => {
  return useQuery({
    queryKey: ['chat-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_settings')
        .select('*')
        .single();

      if (error) throw error;
      return data as ChatSettings;
    },
  });
};

export const useUpdateChatSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<ChatSettings>) => {
      const { data: existing } = await supabase
        .from('chat_settings')
        .select('id')
        .single();

      if (!existing) throw new Error('No settings found');

      const { data, error } = await supabase
        .from('chat_settings')
        .update(settings)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-settings'] });
    },
  });
};
