// ============================================
// Data Layer: Contact Messages
// Pure Supabase API calls - no UI logic
// ============================================

import { supabase } from '@/integrations/supabase/client';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface CreateContactMessageInput {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export const fetchContactMessages = async (): Promise<ContactMessage[]> => {
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as ContactMessage[];
};

export const createContactMessage = async (input: CreateContactMessageInput): Promise<ContactMessage> => {
  const { data, error } = await supabase
    .from('contact_messages')
    .insert([input])
    .select()
    .single();

  if (error) throw error;
  
  // Dispatch webhook after successful creation
  try {
    const { dispatchContactWebhook } = await import('@/lib/webhooks/dispatcher');
    await dispatchContactWebhook(input);
  } catch (webhookError) {
    console.error('Webhook dispatch failed:', webhookError);
    // Don't throw - webhook failure shouldn't fail the message creation
  }
  
  return data as ContactMessage;
};

export const markMessageAsRead = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('contact_messages')
    .update({ is_read: true })
    .eq('id', id);

  if (error) throw error;
};

export const deleteContactMessage = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('contact_messages')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const subscribeToContactMessages = (callback: () => void): (() => void) => {
  const channel = supabase
    .channel('contact_messages_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'contact_messages' },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
