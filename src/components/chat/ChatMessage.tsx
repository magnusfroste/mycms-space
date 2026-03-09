// ============================================
// Chat Message Component
// Renders a single chat message (user or bot)
// ============================================

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Globe, Loader2, Volume2, VolumeX } from "lucide-react";
import { MarkdownContent } from "@/components/common";
import ChatArtifactComponent from "./ChatArtifact";
import type { Message } from "./types";

interface ChatMessageProps {
  message: Message;
  voiceEnabled?: boolean;
  isPlaying?: boolean;
  onSpeak?: (text: string, messageId: string) => void;
}

const USER_MSG_TRUNCATE = 200;

const ChatMessage: React.FC<ChatMessageProps> = ({ message, voiceEnabled, isPlaying, onSpeak }) => {
  const [expanded, setExpanded] = useState(false);
  const isLongUserMsg = message.isUser && message.text.length > USER_MSG_TRUNCATE;

  const displayText = isLongUserMsg && !expanded
    ? message.text.substring(0, message.text.lastIndexOf(' ', USER_MSG_TRUNCATE) || USER_MSG_TRUNCATE) + '…'
    : message.text;

  // Strip markdown for TTS
  const plainText = message.text
    .replace(/[#*_`~\[\]()>!|-]/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  return (
    <div
      className={`flex flex-col ${message.isUser ? "items-end" : "items-start"}`}
      data-user-message={message.isUser ? "true" : "false"}
    >
      {message.source === 'cv-agent' && (
        <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground mb-1.5 mr-1">
          Job Description
        </span>
      )}
      <div
        className={`max-w-[85%] px-4 py-3 ${
          message.isUser
            ? "bg-foreground text-background rounded-2xl rounded-br-sm"
            : "bg-muted/30 text-foreground rounded-2xl rounded-bl-sm border border-border/50"
        }`}
      >
        {message.isUser ? (
          <div>
            <p className="text-sm leading-relaxed text-left whitespace-pre-wrap">{displayText}</p>
            {isLongUserMsg && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 mt-1.5 text-xs opacity-60 hover:opacity-100 transition-opacity"
              >
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {expanded ? 'Less' : 'More'}
              </button>
            )}
          </div>
        ) : (
          <>
            {message.status === 'working' && (
              <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                <Globe className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium">Scraping via extension</span>
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
              </div>
            )}
            <MarkdownContent content={message.text} compact className="text-left" />
          </>
        )}
      </div>

      {/* TTS button for AI messages */}
      {voiceEnabled && !message.isUser && plainText.length > 0 && (
        <button
          onClick={() => onSpeak?.(plainText, message.id)}
          className={`mt-1 p-1 rounded-md transition-colors ${
            isPlaying
              ? "text-primary"
              : "text-muted-foreground/40 hover:text-muted-foreground"
          }`}
          aria-label={isPlaying ? "Stop playback" : "Read aloud"}
        >
          {isPlaying ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </button>
      )}

      {message.artifacts?.map((artifact, index) => (
        <div key={index} className="w-full max-w-[85%]">
          <ChatArtifactComponent artifact={artifact} />
        </div>
      ))}
    </div>
  );
};

export default ChatMessage;
