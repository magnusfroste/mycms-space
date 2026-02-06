// ============================================
// Model Layer: Contact Messages
// Business logic, React Query hooks
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
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
  return useMutation({
    mutationFn: contactMessagesData.createContactMessage,
    onSuccess: () => {
      toast.success('Meddelande skickat');
    },
    onError: (error: Error) => {
      toast.error('Fel: ' + error.message);
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

  return useMutation({
    mutationFn: contactMessagesData.deleteContactMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactMessagesKeys.all });
      toast.success('Meddelande borttaget');
    },
    onError: (error: Error) => {
      toast.error('Fel: ' + error.message);
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
