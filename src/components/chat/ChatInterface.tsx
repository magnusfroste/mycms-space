// ============================================
// Chat Interface Component
// Main chat component that orchestrates sub-components
// ============================================

import React, { useState } from "react";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";
import ChatQuickActions from "./ChatQuickActions";
import { useChatMessages } from "./useChatMessages";
import type { ChatInterfaceProps } from "./types";

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  webhookUrl,
  initialPlaceholder = "Hi, I'm Magnet, Magnus agentic twin. How can I help you today?",
  activePlaceholder = "How can Magnet help?",
  quickActions = [],
  fullPage = false,
  initialMessages,
  resetTrigger = 0,
  onMessagesChange,
  initialSessionId,
  onSessionIdChange,
  skipWebhook = false,
  showQuickActions = false,
  siteContext = null,
  integration = "n8n",
  integrationConfig,
  systemPrompt = '',
  enabledTools,
}) => {
  const [inputValue, setInputValue] = useState("");

  const { messages, isLoading, sendMessage, sendPrefilledMessage } = useChatMessages({
    webhookUrl,
    initialMessages,
    initialSessionId,
    resetTrigger,
    skipWebhook,
    siteContext,
    systemPrompt,
    integration,
    integrationConfig,
    enabledTools,
    onMessagesChange,
    onSessionIdChange,
  });

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const message = inputValue;
    setInputValue("");
    await sendMessage(message);
  };

  const handleQuickAction = async (message: string) => {
    setInputValue(message);
    if (skipWebhook) {
      await sendPrefilledMessage(message);
      setInputValue("");
    } else {
      setTimeout(async () => {
        setInputValue("");
        await sendMessage(message);
      }, 100);
    }
  };

  const placeholder = messages.length > 0 ? activePlaceholder : initialPlaceholder;

  return (
    <div className={fullPage ? "flex flex-col h-full relative" : "max-w-3xl mx-auto"}>
      <ChatMessageList
        messages={messages}
        isLoading={isLoading}
        fullPage={fullPage}
      />

      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        placeholder={placeholder}
        isLoading={isLoading}
        fullPage={fullPage}
      />

      {showQuickActions && messages.length === 0 && (
        <div className="px-6">
          <ChatQuickActions
            actions={quickActions}
            onSelect={handleQuickAction}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
