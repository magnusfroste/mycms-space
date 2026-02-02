// ============================================
// Model Layer: Newsletter
// React Query hooks + business logic
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import * as newsletterData from '@/data/newsletter';

export type {
  NewsletterSubscriber,
  NewsletterCampaign,
  CreateSubscriberInput,
  CreateCampaignInput,
  UpdateCampaignInput,
} from '@/data/newsletter';

// Query keys
export const newsletterKeys = {
  all: ['newsletter'] as const,
  subscribers: () => [...newsletterKeys.all, 'subscribers'] as const,
  campaigns: () => [...newsletterKeys.all, 'campaigns'] as const,
  campaign: (id: string) => [...newsletterKeys.campaigns(), id] as const,
};

// ============================================
// Subscriber Hooks
// ============================================

export const useSubscribers = () => {
  return useQuery({
    queryKey: newsletterKeys.subscribers(),
    queryFn: newsletterData.fetchSubscribers,
  });
};

export const useCreateSubscriber = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: newsletterData.createSubscriber,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsletterKeys.subscribers() });
    },
  });
};

export const useUpdateSubscriberStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'unsubscribed' | 'bounced' }) =>
      newsletterData.updateSubscriberStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsletterKeys.subscribers() });
    },
  });
};

export const useDeleteSubscriber = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: newsletterData.deleteSubscriber,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsletterKeys.subscribers() });
    },
  });
};

// ============================================
// Campaign Hooks
// ============================================

export const useCampaigns = () => {
  return useQuery({
    queryKey: newsletterKeys.campaigns(),
    queryFn: newsletterData.fetchCampaigns,
  });
};

export const useCampaignById = (id: string) => {
  return useQuery({
    queryKey: newsletterKeys.campaign(id),
    queryFn: () => newsletterData.fetchCampaignById(id),
    enabled: !!id,
  });
};

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: newsletterData.createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsletterKeys.campaigns() });
    },
  });
};

export const useUpdateCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: newsletterData.UpdateCampaignInput }) =>
      newsletterData.updateCampaign(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: newsletterKeys.campaign(id) });
      queryClient.invalidateQueries({ queryKey: newsletterKeys.campaigns() });
    },
  });
};

export const useDeleteCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: newsletterData.deleteCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsletterKeys.campaigns() });
    },
  });
};

export const useSendNewsletter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: newsletterData.sendNewsletter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsletterKeys.campaigns() });
    },
  });
};

// ============================================
// Realtime Subscriptions
// ============================================

export const useSubscribersSubscription = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = newsletterData.subscribeToSubscribers(() => {
      queryClient.invalidateQueries({ queryKey: newsletterKeys.subscribers() });
    });

    return unsubscribe;
  }, [queryClient]);
};

export const useCampaignsSubscription = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = newsletterData.subscribeToCampaigns(() => {
      queryClient.invalidateQueries({ queryKey: newsletterKeys.campaigns() });
    });

    return unsubscribe;
  }, [queryClient]);
};
