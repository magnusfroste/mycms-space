// ============================================
// Chat Message Component
// Renders a single chat message (user or bot)
// ============================================

import React from "react";
import { parseMarkdown } from "@/lib/markdown";
import type { Message } from "./types";

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  return (
    <div
      className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
      data-user-message={message.isUser ? "true" : "false"}
    >
      <div
        className={`max-w-[95%] px-4 py-3 rounded-2xl ${
          message.isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted/20 text-foreground rounded-bl-md"
        }`}
      >
        {message.isUser ? (
          <p className="text-sm leading-relaxed text-left">{message.text}</p>
        ) : (
          <div
            className="text-sm leading-relaxed prose prose-sm max-w-none text-left"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(message.text) }}
          />
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
