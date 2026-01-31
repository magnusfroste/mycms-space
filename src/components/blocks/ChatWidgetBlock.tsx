// ============================================
// Chat Widget Block
// Reads quick actions from block_config JSONB
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import AppleChat, { Message } from '@/components/AppleChat';
import { useChatSettings } from '@/hooks/useChatSettings';
import type { ChatWidgetBlockConfig } from '@/types/blockConfigs';

interface ChatWidgetBlockProps {
  config: Record<string, unknown>;
}

const ChatWidgetBlock: React.FC<ChatWidgetBlockProps> = ({ config }) => {
  const typedConfig = config as ChatWidgetBlockConfig;
  const navigate = useNavigate();
  const { data: settings } = useChatSettings();
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);
  const didNavigateRef = React.useRef(false);

  const title = typedConfig.title;
  const subtitle = typedConfig.subtitle;
  const showQuickActions = typedConfig.show_quick_actions ?? true;
  const quickActions = typedConfig.quick_actions?.filter(qa => qa.enabled) || [];

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

  const webhookUrl = settings?.webhook_url || 'https://agent.froste.eu/webhook/magnet';

  return (
    <div className="pb-20" aria-label="Chat Widget">
      <div className="container mx-auto px-4">
        {(title || subtitle) && (
          <div className="text-center mb-8">
            {title && <h2 className="section-title">{title}</h2>}
            {subtitle && (
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}
        <div className="max-w-4xl mx-auto">
          <AppleChat
            webhookUrl={webhookUrl}
            onMessagesChange={setCurrentMessages}
            onSessionIdChange={setCurrentSessionId}
            skipWebhook={true}
            showQuickActions={showQuickActions}
          />
          
          <div className="flex justify-center mt-12">
            <a
              href="#about"
              className="inline-flex items-center justify-center animate-bounce"
              aria-label="Scroll to About section"
            >
              <ChevronDown className="h-8 w-8 text-muted-foreground" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWidgetBlock;
