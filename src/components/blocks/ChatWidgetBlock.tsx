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

  return (
    <div id="chat" className="relative py-12 md:py-20 overflow-hidden" aria-label="Chat Widget">
      {/* Gradient background connecting to hero */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Primary gradient orb - connects with hero */}
        <div 
          className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-20 dark:opacity-30"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
            left: '-10%',
            top: '-30%',
          }}
        />
        {/* Secondary gradient orb */}
        <div 
          className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-15 dark:opacity-25"
          style={{
            background: 'radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)',
            right: '-5%',
            bottom: '-20%',
          }}
        />
        {/* Subtle mesh overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>
      
      <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-3xl mx-auto animate-fade-in">
          <div className="glass-card overflow-hidden backdrop-blur-xl border-primary/10 shadow-glow-sm">
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
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWidgetBlock;
