// ============================================
// Chat Message List Component
// Renders the scrollable list of messages
// ============================================

import React, { useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
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

  // Always render the container to prevent layout shift
  // Only hide content when empty (not the container itself)
  const hasMessages = messages.length > 0;

  return (
    <div
      ref={containerRef}
      className={
        fullPage
          ? "flex-1 overflow-y-auto max-w-4xl mx-auto w-full px-6 py-6 pb-4 flex flex-col justify-end scroll-smooth"
          : "h-80 overflow-y-auto max-w-4xl mx-auto w-full px-6 py-6 flex flex-col justify-end scroll-smooth glass-card shadow-apple"
      }
    >
      {hasMessages && (
        <div className="space-y-4 animate-fade-in">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted/20 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
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
