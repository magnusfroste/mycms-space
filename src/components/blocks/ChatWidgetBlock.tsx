// ============================================
// Chat Widget Block
// Wrapper for ChatLanding component with configurable title
// ============================================

import React from 'react';
import ChatLanding from '@/components/ChatLanding';

interface ChatWidgetBlockConfig {
  title?: string;
  subtitle?: string;
  show_quick_actions?: boolean;
}

interface ChatWidgetBlockProps {
  config: Record<string, unknown>;
}

const ChatWidgetBlock: React.FC<ChatWidgetBlockProps> = ({ config }) => {
  const typedConfig = config as ChatWidgetBlockConfig;

  return (
    <ChatLanding 
      title={typedConfig.title} 
      subtitle={typedConfig.subtitle} 
    />
  );
};

export default ChatWidgetBlock;
