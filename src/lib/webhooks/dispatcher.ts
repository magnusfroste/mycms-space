// ============================================
// Webhook Dispatcher
// Centralized webhook trigger system
// ============================================

import { supabase } from '@/integrations/supabase/client';
import type { WebhookEventType, WebhooksModuleConfig } from '@/types/modules';

interface WebhookPayload {
  event_type: WebhookEventType;
  timestamp: string;
  data: Record<string, unknown>;
}

// Fetch webhook config from modules table
const getWebhooksConfig = async (): Promise<WebhooksModuleConfig | null> => {
  const { data, error } = await supabase
    .from('modules')
    .select('module_config')
    .eq('module_type', 'webhooks')
    .maybeSingle();

  if (error || !data) {
    console.log('No webhooks module configured');
    return null;
  }

  return data.module_config as unknown as WebhooksModuleConfig;
};

// Update webhook status after trigger
const updateWebhookStatus = async (
  eventType: WebhookEventType,
  status: 'success' | 'error'
): Promise<void> => {
  const config = await getWebhooksConfig();
  if (!config) return;

  const updatedEndpoints = config.endpoints.map((endpoint) =>
    endpoint.event_type === eventType
      ? { ...endpoint, last_triggered: new Date().toISOString(), last_status: status }
      : endpoint
  );

  await supabase
    .from('modules')
    .update({ module_config: { endpoints: updatedEndpoints } as unknown as never })
    .eq('module_type', 'webhooks');
};

// Dispatch webhook
export const dispatchWebhook = async (
  eventType: WebhookEventType,
  data: Record<string, unknown>
): Promise<boolean> => {
  try {
    const config = await getWebhooksConfig();
    if (!config) return false;

    const endpoint = config.endpoints.find(
      (e) => e.event_type === eventType && e.enabled && e.url
    );

    if (!endpoint) {
      console.log(`No enabled webhook for event: ${eventType}`);
      return false;
    }

    const payload: WebhookPayload = {
      event_type: eventType,
      timestamp: new Date().toISOString(),
      data,
    };

    console.log(`Dispatching webhook: ${eventType} to ${endpoint.url}`);

    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'no-cors', // Handle CORS for external webhooks
      body: JSON.stringify(payload),
    });

    // With no-cors we can't read response, assume success if no error thrown
    await updateWebhookStatus(eventType, 'success');
    console.log(`Webhook dispatched successfully: ${eventType}`);
    return true;
  } catch (error) {
    console.error(`Webhook dispatch failed for ${eventType}:`, error);
    await updateWebhookStatus(eventType, 'error');
    return false;
  }
};

// Convenience functions for specific events
export const dispatchContactWebhook = (data: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}) => dispatchWebhook('contact.message_received', data);

export const dispatchNewsletterWebhook = (data: {
  email: string;
  name?: string;
}) => dispatchWebhook('newsletter.subscriber_added', data);

export const dispatchBlogWebhook = (data: {
  title: string;
  slug: string;
  excerpt?: string;
}) => dispatchWebhook('blog.post_published', data);

export const dispatchChatWebhook = (data: {
  session_id: string;
  visitor_id: string;
}) => dispatchWebhook('chat.session_started', data);
