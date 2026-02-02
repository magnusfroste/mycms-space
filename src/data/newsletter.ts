// ============================================
// Data Layer: Newsletter
// Pure Supabase API calls - no UI logic
// ============================================

import { supabase } from '@/integrations/supabase/client';

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name: string | null;
  status: 'active' | 'unsubscribed' | 'bounced';
  subscribed_at: string;
  unsubscribed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewsletterCampaign {
  id: string;
  subject: string;
  content: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduled_for: string | null;
  sent_at: string | null;
  recipient_count: number | null;
  open_count: number | null;
  click_count: number | null;
  created_at: string;
  updated_at: string;
}

export type CreateSubscriberInput = {
  email: string;
  name?: string;
};

export type CreateCampaignInput = {
  subject: string;
  content: string;
  scheduled_for?: string;
};

export type UpdateCampaignInput = Partial<CreateCampaignInput> & {
  status?: NewsletterCampaign['status'];
};

// ============================================
// Subscribers
// ============================================

export const fetchSubscribers = async (): Promise<NewsletterSubscriber[]> => {
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .order('subscribed_at', { ascending: false });

  if (error) {
    console.error('Error fetching subscribers:', error);
    throw error;
  }

  return (data || []) as NewsletterSubscriber[];
};

export const createSubscriber = async (
  input: CreateSubscriberInput
): Promise<NewsletterSubscriber> => {
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .insert(input)
    .select()
    .single();

  if (error) {
    console.error('Error creating subscriber:', error);
    throw error;
  }

  return data as NewsletterSubscriber;
};

export const updateSubscriberStatus = async (
  id: string,
  status: NewsletterSubscriber['status']
): Promise<NewsletterSubscriber> => {
  const updates: Record<string, unknown> = { status };
  if (status === 'unsubscribed') {
    updates.unsubscribed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating subscriber:', error);
    throw error;
  }

  return data as NewsletterSubscriber;
};

export const deleteSubscriber = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('newsletter_subscribers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting subscriber:', error);
    throw error;
  }
};

// ============================================
// Campaigns
// ============================================

export const fetchCampaigns = async (): Promise<NewsletterCampaign[]> => {
  const { data, error } = await supabase
    .from('newsletter_campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }

  return (data || []) as NewsletterCampaign[];
};

export const fetchCampaignById = async (
  id: string
): Promise<NewsletterCampaign | null> => {
  const { data, error } = await supabase
    .from('newsletter_campaigns')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching campaign:', error);
    throw error;
  }

  return data as NewsletterCampaign | null;
};

export const createCampaign = async (
  input: CreateCampaignInput
): Promise<NewsletterCampaign> => {
  const { data, error } = await supabase
    .from('newsletter_campaigns')
    .insert(input)
    .select()
    .single();

  if (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }

  return data as NewsletterCampaign;
};

export const updateCampaign = async (
  id: string,
  updates: UpdateCampaignInput
): Promise<NewsletterCampaign> => {
  const { data, error } = await supabase
    .from('newsletter_campaigns')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating campaign:', error);
    throw error;
  }

  return data as NewsletterCampaign;
};

export const deleteCampaign = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('newsletter_campaigns')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting campaign:', error);
    throw error;
  }
};

// ============================================
// Send Newsletter (via Edge Function)
// ============================================

export const sendNewsletter = async (
  campaignId: string,
  fromEmail?: string
): Promise<{
  success: boolean;
  sent?: number;
  total?: number;
  error?: string;
}> => {
  const { data, error } = await supabase.functions.invoke('send-newsletter', {
    body: { campaignId, fromEmail },
  });

  if (error) {
    console.error('Error sending newsletter:', error);
    throw error;
  }

  return data;
};

// ============================================
// Realtime Subscriptions
// ============================================

export const subscribeToSubscribers = (
  callback: () => void
): (() => void) => {
  const channel = supabase
    .channel('newsletter_subscribers_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'newsletter_subscribers',
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const subscribeToCampaigns = (
  callback: () => void
): (() => void) => {
  const channel = supabase
    .channel('newsletter_campaigns_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'newsletter_campaigns',
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
