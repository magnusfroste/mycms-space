// ============================================
// Chat Message List Component
// Renders the scrollable list of messages
// ============================================

import React, { useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";
import { useTTS } from "@/hooks/useVoice";
import type { Message } from "./types";

interface ChatMessageListProps {
  messages: Message[];
  isLoading: boolean;
  fullPage: boolean;
  voiceEnabled?: boolean;
  ttsVoice?: string;
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isLoading,
  fullPage,
  voiceEnabled = false,
  ttsVoice,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSpokenIdRef = useRef<string | null>(null);
  const { isPlaying, speak } = useTTS();

  const handleSpeak = (text: string, messageId: string) => {
    speak(text, messageId, ttsVoice);
  };

  // Auto-read new AI messages when voice is enabled
  useEffect(() => {
    if (!voiceEnabled || messages.length === 0 || isLoading) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.isUser || lastMsg.id === lastSpokenIdRef.current) return;
    
    const plainText = lastMsg.text
      .replace(/[#*_`~[\]()>!|-]/g, '')
      .replace(/\n+/g, ' ')
      .trim();
    
    if (plainText.length > 0) {
      lastSpokenIdRef.current = lastMsg.id;
      speak(plainText, lastMsg.id, ttsVoice);
    }
  }, [voiceEnabled, messages, isLoading, speak, ttsVoice]);

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
          ? "flex-1 overflow-y-auto scroll-smooth"
          : "h-80 overflow-y-auto scroll-smooth"
      }
    >
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 pb-6 pt-6 sm:px-6">
        {hasMessages && (
          <div className="space-y-7">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                voiceEnabled={voiceEnabled}
                isPlaying={isPlaying === message.id}
                onSpeak={handleSpeak}
              />
            ))}

            {isLoading && (
              <div className="flex items-center py-2" role="status" aria-label="Magnet is thinking">
                <span className="h-3 w-3 animate-pulse rounded-full bg-foreground" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessageList;
