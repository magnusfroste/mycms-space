// ============================================
// Chat Types
// Shared types for chat components
// ============================================

import type { AIIntegrationType, AIIntegration } from "@/types/modules";

// Artifact types for rich structured content in chat
export interface ChatArtifact {
  type: 'cv-match' | 'document' | 'portfolio' | 'project-deep-dive' | 'availability';
  title: string;
  data: Record<string, unknown>;
}

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  artifacts?: ChatArtifact[];
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
    blocks?: Array<{ type: string; content: string }>;
  }>;
  blogs?: Array<{
    slug: string;
    title: string;
    excerpt?: string;
    content: string;
  }>;
  repos?: Array<{
    name: string;
    description: string;
    enrichedDescription?: string;
    problemStatement?: string;
    whyItMatters?: string;
    language?: string;
    topics?: string[];
    url: string;
  }>;
}

// Chat message format for API calls
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
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
  systemPrompt?: string;
}
