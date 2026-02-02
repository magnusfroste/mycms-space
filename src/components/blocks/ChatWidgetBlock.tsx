// ============================================
// Chat Widget Block - 2026 Design System
// Modern chat interface with glass styling
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, MessageCircle } from 'lucide-react';
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

  // Block-level config (per-instance)
  const title = typedConfig.title;
  const subtitle = typedConfig.subtitle;
  const showQuickActions = typedConfig.show_quick_actions ?? true;
  const quickActions = typedConfig.quick_actions?.filter(qa => qa.enabled) || [];
  const initialPlaceholder = typedConfig.initial_placeholder || "Hi, I'm Magnet, Magnus agentic twin. How can I help you today?";
  const activePlaceholder = typedConfig.active_placeholder || "How can Magnet help?";

  // Global config (from modules)
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

  // Don't render if module is disabled
  if (!isModuleEnabled) {
    return null;
  }

  return (
    <div className="section-container-sm relative" aria-label="Chat Widget">
      <div className="container mx-auto px-4">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-10">
            {!title && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
                <MessageCircle className="w-4 h-4" />
                <span>AI Assistant</span>
              </div>
            )}
            {title && (
              <h2 
                className="section-title animate-fade-in"
                style={{ animationDelay: '0.1s' }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p 
                className="section-subtitle mt-4 animate-fade-in"
                style={{ animationDelay: '0.2s' }}
              >
                {subtitle}
              </p>
            )}
          </div>
        )}
        
        {/* Chat Container */}
        <div 
          className="max-w-4xl mx-auto animate-fade-in"
          style={{ animationDelay: '0.3s' }}
        >
          <div className="elevated-card overflow-hidden">
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
        
        {/* Scroll Indicator */}
        <div className="flex justify-center mt-16 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <a
            href="#about"
            className="group inline-flex flex-col items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            aria-label="Scroll to About section"
          >
            <span className="text-xs uppercase tracking-widest">Explore</span>
            <ChevronDown className="h-6 w-6 animate-bounce" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ChatWidgetBlock;