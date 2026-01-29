// ============================================
// Model Layer: Contact Messages
// Business logic, React Query hooks
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import * as contactMessagesData from '@/data/contactMessages';
import type { ContactMessage, CreateContactMessageInput } from '@/data/contactMessages';

// Re-export types
export type { ContactMessage, CreateContactMessageInput };

// Query keys
export const contactMessagesKeys = {
  all: ['contact-messages'] as const,
};

// Fetch all messages
export const useContactMessages = () => {
  return useQuery({
    queryKey: contactMessagesKeys.all,
    queryFn: contactMessagesData.fetchContactMessages,
  });
};

// Create a new message (public)
export const useCreateContactMessage = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: contactMessagesData.createContactMessage,
    onSuccess: () => {
      toast({ title: 'Meddelande skickat', description: 'Tack för ditt meddelande!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Fel', description: error.message, variant: 'destructive' });
    },
  });
};

// Mark message as read
export const useMarkMessageAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: contactMessagesData.markMessageAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactMessagesKeys.all });
    },
  });
};

// Delete message
export const useDeleteContactMessage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: contactMessagesData.deleteContactMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactMessagesKeys.all });
      toast({ title: 'Meddelande borttaget' });
    },
    onError: (error: Error) => {
      toast({ title: 'Fel', description: error.message, variant: 'destructive' });
    },
  });
};

// Realtime subscription
export const useContactMessagesSubscription = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = contactMessagesData.subscribeToContactMessages(() => {
      queryClient.invalidateQueries({ queryKey: contactMessagesKeys.all });
    });

    return unsubscribe;
  }, [queryClient]);
};
