// ============================================
// Chat Types
// Shared types for chat components
// ============================================

import type { AIIntegrationType, AIIntegration } from "@/types/modules";

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

export interface QuickActionConfig {
  id: string;
  label: string;
  message: string;
  icon: string;
  order_index: number;
  enabled: boolean;
}

export interface SiteContext {
  pages?: Array<{
    slug: string;
    title: string;
    content: string;
  }>;
  blogs?: Array<{
    slug: string;
    title: string;
    excerpt?: string;
    content: string;
  }>;
}

export interface ChatInterfaceProps {
  webhookUrl: string;
  initialPlaceholder?: string;
  activePlaceholder?: string;
  quickActions?: QuickActionConfig[];
  fullPage?: boolean;
  initialMessages?: Message[];
  resetTrigger?: number;
  onMessagesChange?: (messages: Message[]) => void;
  initialSessionId?: string;
  onSessionIdChange?: (id: string) => void;
  skipWebhook?: boolean;
  showQuickActions?: boolean;
  siteContext?: SiteContext | null;
  integration?: AIIntegrationType;
  integrationConfig?: AIIntegration;
}
