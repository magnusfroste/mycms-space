// ============================================
// Chat Message List Component
// Renders the scrollable list of messages
// ============================================

import React, { useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";
import type { Message } from "./types";

interface ChatMessageListProps {
  messages: Message[];
  isLoading: boolean;
  fullPage: boolean;
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isLoading,
  fullPage,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const hasMessages = messages.length > 0;

  return (
    <div
      ref={containerRef}
      className={
        fullPage
          ? "flex-1 overflow-y-auto max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 pb-4 flex flex-col justify-end scroll-smooth"
          : "h-80 overflow-y-auto max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col justify-end scroll-smooth"
      }
    >
      {hasMessages && (
        <div className="space-y-5 animate-fade-in">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted/30 border border-border/50 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse [animation-delay:0.2s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};

export default ChatMessageList;
