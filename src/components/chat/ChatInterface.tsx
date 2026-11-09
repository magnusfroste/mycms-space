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
  mode = 'public',
  extensionId,
  voiceEnabled = false,
  ttsVoice,
  visitorConfig,
  emptyTitle,
  emptySubtitle,
  footerNote,
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
    mode,
    extensionId,
    onMessagesChange,
    onSessionIdChange,
    visitorConfig,
  });

  const handleSend = async (attachedFileContent?: string, attachedFileName?: string) => {
    const hasFile = !!attachedFileContent;
    if (!inputValue.trim() && !hasFile) return;
    const message = hasFile
      ? `${inputValue ? inputValue + "\n\n" : ""}📎 **${attachedFileName}**\n\`\`\`\n${attachedFileContent}\n\`\`\``
      : inputValue;
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
  const isEmpty = messages.length === 0;
  const suggestions = showQuickActions && isEmpty ? (
    <ChatQuickActions actions={quickActions} onSelect={handleQuickAction} isLoading={isLoading} />
  ) : null;

  const input = (variant: "docked" | "inline") => (
    <ChatInput
      value={inputValue}
      onChange={setInputValue}
      onSend={handleSend}
      placeholder={placeholder}
      isLoading={isLoading}
      fullPage={fullPage}
      variant={variant}
      footer={variant === "docked" ? footerNote : undefined}
      voiceEnabled={voiceEnabled}
      commands={quickActions}
      onCommandSelect={handleQuickAction}
    />
  );

  // Full page, no messages yet: heading, composer and suggestions centred (ChatGPT's new chat).
  if (fullPage && isEmpty) {
    return (
      <div className="flex h-full flex-col overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 pb-[12vh] pt-8 sm:px-6">
          {emptyTitle && (
            <h1 className="mb-2 text-center text-[26px] font-semibold tracking-[-0.02em] text-foreground sm:text-[30px]">
              {emptyTitle}
            </h1>
          )}
          {emptySubtitle && (
            <p className="mx-auto mb-7 max-w-xl text-center text-[15px] leading-[1.55] text-muted-foreground">{emptySubtitle}</p>
          )}
          {!emptySubtitle && emptyTitle && <div className="mb-5" />}
          {input("inline")}
          {suggestions && <div className="mt-5">{suggestions}</div>}
        </div>
        {footerNote && <p className="shrink-0 px-4 pb-3 text-center text-xs text-muted-foreground">{footerNote}</p>}
      </div>
    );
  }

  return (
    <div className={fullPage ? "flex h-full flex-col overflow-hidden" : "mx-auto max-w-3xl"}>
      <ChatMessageList
        messages={messages}
        isLoading={isLoading}
        fullPage={fullPage}
        voiceEnabled={voiceEnabled}
        ttsVoice={ttsVoice}
      />
      {input(fullPage ? "docked" : "inline")}
      {suggestions && <div className="mt-4 px-4">{suggestions}</div>}
    </div>
  );
};

export default ChatInterface;
