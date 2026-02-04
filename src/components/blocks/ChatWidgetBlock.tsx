// ============================================
// Chat Widget Block - 2026 Design System
// Clean, minimal chat interface
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatInterface, Message } from '@/components/chat';
import { useAIModule } from '@/models/modules';
import { useAIChatContext } from '@/hooks/useAIChatContext';
import type { ChatWidgetBlockConfig } from '@/types/blockConfigs';

interface ChatWidgetBlockProps {
  config: Record<string, unknown>;
}

const ChatWidgetBlock: React.FC<ChatWidgetBlockProps> = ({ config }) => {
  const typedConfig = config as ChatWidgetBlockConfig;
  const navigate = useNavigate();
  const { config: aiConfig, isEnabled: isModuleEnabled } = useAIModule();
  const { contextData } = useAIChatContext();
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);
  const didNavigateRef = React.useRef(false);

  const showQuickActions = typedConfig.show_quick_actions ?? true;
  const quickActions = typedConfig.quick_actions?.filter(qa => qa.enabled) || [];
  const initialPlaceholder = typedConfig.initial_placeholder || "Hi, I'm Magnet, Magnus agentic twin. How can I help you today?";
  const activePlaceholder = typedConfig.active_placeholder || "How can Magnet help?";
  const webhookUrl = aiConfig?.webhook_url || 'https://agent.froste.eu/webhook/magnet';
  const systemPrompt = aiConfig?.system_prompt || '';

  // Navigate to full chat after first user message
  useEffect(() => {
    const hasUserMsg = currentMessages.some((m) => m.isUser);
    if (hasUserMsg && !didNavigateRef.current && currentSessionId) {
      didNavigateRef.current = true;
      navigate('/chat', {
        state: {
          fromHero: true,
          messages: currentMessages,
          sessionId: currentSessionId,
        },
      });
    }
  }, [currentMessages, currentSessionId, navigate]);

  if (!isModuleEnabled) {
    return null;
  }

  const title = typedConfig.title;
  const subtitle = typedConfig.subtitle;

  return (
    <div id="chat" className="py-12 md:py-20" aria-label="Chat Widget">
      <div className="container mx-auto px-4">
        {/* Title and subtitle */}
        {(title || subtitle) && (
          <div className="text-center mb-8 max-w-3xl mx-auto">
            {title && (
              <h2 className="text-2xl md:text-3xl font-bold mb-2">{title}</h2>
            )}
            {subtitle && (
              <p className="text-muted-foreground">{subtitle}</p>
            )}
          </div>
        )}
        
        <div className="max-w-3xl mx-auto">
          <ChatInterface
            webhookUrl={webhookUrl}
            initialPlaceholder={initialPlaceholder}
            activePlaceholder={activePlaceholder}
            quickActions={quickActions}
            onMessagesChange={setCurrentMessages}
            onSessionIdChange={setCurrentSessionId}
            skipWebhook={true}
            showQuickActions={showQuickActions}
            siteContext={contextData}
            systemPrompt={systemPrompt}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatWidgetBlock;
