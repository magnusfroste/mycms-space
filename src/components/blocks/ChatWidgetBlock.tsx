// ============================================
// Chat Widget Block
// Wrapper for ChatLanding component
// ============================================

import React from 'react';
import ChatLanding from '@/components/ChatLanding';

interface ChatWidgetBlockConfig {
  show_quick_actions?: boolean;
}

interface ChatWidgetBlockProps {
  config: Record<string, unknown>;
}

const ChatWidgetBlock: React.FC<ChatWidgetBlockProps> = ({ config }) => {
  // Config can be extended in the future
  const _typedConfig = config as ChatWidgetBlockConfig;

  return <ChatLanding />;
};

export default ChatWidgetBlock;
