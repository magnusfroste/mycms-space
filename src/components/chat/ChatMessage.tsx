// ============================================
// Chat Message
// ChatGPT-style: the user's turn is a soft bubble on the right, the
// assistant's answer is plain, full-width text with a small action row.
// ============================================

import React, { Suspense, lazy, useState } from "react";
import { Check, ChevronDown, ChevronUp, Copy, Globe, Loader2, Volume2, VolumeX } from "lucide-react";
import { MarkdownContent } from "@/components/common";
import type { Message } from "./types";

// Artifacts pull in recharts (~400 KB) - load only when a message actually has one
const ChatArtifactComponent = lazy(() => import("./ChatArtifact"));

interface ChatMessageProps {
  message: Message;
  voiceEnabled?: boolean;
  isPlaying?: boolean;
  onSpeak?: (text: string, messageId: string) => void;
}

const USER_MSG_TRUNCATE = 400;

const toPlainText = (text: string) =>
  text.replace(/[#*_`~[\]()>!|-]/g, "").replace(/\n+/g, " ").trim();

const ChatMessage: React.FC<ChatMessageProps> = ({ message, voiceEnabled, isPlaying, onSpeak }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const isLongUserMsg = message.isUser && message.text.length > USER_MSG_TRUNCATE;

  const displayText = isLongUserMsg && !expanded
    ? message.text.substring(0, message.text.lastIndexOf(" ", USER_MSG_TRUNCATE) || USER_MSG_TRUNCATE) + "…"
    : message.text;

  const plainText = toPlainText(message.text);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (message.isUser) {
    return (
      <div className="flex flex-col items-end" data-user-message="true">
        {message.source === "cv-agent" && (
          <span className="mb-1.5 mr-2 text-[11px] font-medium text-muted-foreground">Job description</span>
        )}
        <div className="max-w-[85%] rounded-3xl bg-muted px-5 py-2.5 text-foreground sm:max-w-[75%]">
          <p className="whitespace-pre-wrap text-left text-[15px] leading-[1.6]">{displayText}</p>
          {isLongUserMsg && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="group flex flex-col items-start" data-user-message="false">
      {message.status === "working" && (
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Globe className="h-3.5 w-3.5" />
          <span className="font-medium">Reading the page via your browser extension</span>
          <Loader2 className="h-3 w-3 animate-spin" />
        </div>
      )}

      {/* Answer typography (ChatGPT-like rhythm). Set with !important descendant
          selectors so the shared prose/theme resets can't flatten it. */}
      <div className="chat-answer w-full text-left text-[15px] leading-[1.75] text-foreground [&_p]:!my-3 [&_p]:!leading-[1.75] [&_ul]:!my-3 [&_ul]:!list-disc [&_ul]:!pl-6 [&_ol]:!my-3 [&_ol]:!list-decimal [&_ol]:!pl-6 [&_li]:!my-1.5 [&_li]:!pl-1 [&_li::marker]:text-muted-foreground [&_h1]:!mb-2 [&_h1]:!mt-6 [&_h2]:!mb-2 [&_h2]:!mt-6 [&_h3]:!mb-2 [&_h3]:!mt-5 [&_.prose>*:first-child]:!mt-0 [&_.prose>*:last-child]:!mb-0">
        <MarkdownContent content={message.text} blankLineSpacers={false} />
      </div>

      {message.artifacts?.map((artifact, index) => (
        <div key={index} className="mt-3 w-full">
          <Suspense fallback={<div className="h-24 w-full animate-pulse rounded-xl border border-border bg-muted/40" />}>
            <ChatArtifactComponent artifact={artifact} />
          </Suspense>
        </div>
      ))}

      {plainText.length > 0 && message.status !== "working" && (
        <div className="mt-1 flex items-center gap-0.5 text-muted-foreground opacity-70 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={copy}
            className="rounded-md p-1.5 hover:bg-muted hover:text-foreground"
            aria-label={copied ? "Copied" : "Copy answer"}
            title={copied ? "Copied" : "Copy"}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
          {voiceEnabled && (
            <button
              type="button"
              onClick={() => onSpeak?.(plainText, message.id)}
              className={`rounded-md p-1.5 hover:bg-muted hover:text-foreground ${isPlaying ? "text-foreground" : ""}`}
              aria-label={isPlaying ? "Stop reading" : "Read aloud"}
              title={isPlaying ? "Stop" : "Read aloud"}
            >
              {isPlaying ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
