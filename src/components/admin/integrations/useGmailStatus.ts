import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GmailStatus {
  connected: boolean;
  /** True when the stored refresh token no longer works. */
  needs_reconnect?: boolean;
  email: string | null;
  connected_at: string | null;
  filter_senders?: string[];
  filter_labels?: string[];
  max_messages?: number;
  scan_days?: number;
  last_scan?: { scanned_at: string; signal_count: number } | null;
}

export const gmailStatusKey = ['gmail-status'] as const;

export function useGmailStatus() {
  return useQuery({
    queryKey: gmailStatusKey,
    queryFn: async (): Promise<GmailStatus> => {
      const { data, error } = await supabase.functions.invoke('gmail-oauth-callback', {
        body: { action: 'status' },
      });
      if (error || !data) return { connected: false, email: null, connected_at: null };
      return data as GmailStatus;
    },
    staleTime: 5 * 60_000,
  });
}
