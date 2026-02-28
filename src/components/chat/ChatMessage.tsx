// ============================================
// Chat Message Component
// Renders a single chat message (user or bot)
// ============================================

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { MarkdownContent } from "@/components/common";
import ChatArtifactComponent from "./ChatArtifact";
import type { Message } from "./types";

interface ChatMessageProps {
  message: Message;
}

const USER_MSG_TRUNCATE = 200;

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [expanded, setExpanded] = useState(false);
  const isLongUserMsg = message.isUser && message.text.length > USER_MSG_TRUNCATE;

  const displayText = isLongUserMsg && !expanded
    ? message.text.substring(0, message.text.lastIndexOf(' ', USER_MSG_TRUNCATE) || USER_MSG_TRUNCATE) + '…'
    : message.text;

  return (
    <div
      className={`flex flex-col ${message.isUser ? "items-end" : "items-start"}`}
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
          <div>
            <p className="text-sm leading-relaxed text-left whitespace-pre-wrap">{displayText}</p>
            {isLongUserMsg && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 mt-1.5 text-xs opacity-70 hover:opacity-100 transition-opacity"
              >
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {expanded ? 'Show less' : 'Show full message'}
              </button>
            )}
          </div>
        ) : (
          <MarkdownContent content={message.text} compact className="text-left" />
        )}
      </div>
      {message.artifacts?.map((artifact, index) => (
        <div key={index} className="w-full max-w-[95%]">
          <ChatArtifactComponent artifact={artifact} />
        </div>
      ))}
    </div>
  );
};

export default ChatMessage;
