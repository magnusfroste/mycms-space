import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { parseMarkdown } from "@/lib/markdown";

// Helper to clean webhook response text
const cleanWebhookResponse = (text: string): string => {
  if (!text || typeof text !== "string") return "";

  return (
    text
      .trim()
      // Remove any control characters except newlines and tabs
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "")
      // Normalize line breaks (convert CRLF and CR to LF)
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      // Remove excessive whitespace but preserve paragraph breaks
      .replace(/\n{3,}/g, "\n\n")
      // Trim each line
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      // Remove any leading/trailing whitespace
      .trim()
  );
};

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

interface AppleChatProps {
  webhookUrl: string;
  fullPage?: boolean;
  initialMessages?: Message[];
  resetTrigger?: number;
  onMessagesChange?: (messages: Message[]) => void;
  initialSessionId?: string;
  onSessionIdChange?: (id: string) => void;
  skipWebhook?: boolean;
  showQuickActions?: boolean;
}

const AppleChat: React.FC<AppleChatProps> = ({
  webhookUrl,
  fullPage = false,
  initialMessages,
  resetTrigger = 0,
  onMessagesChange,
  initialSessionId,
  onSessionIdChange,
  skipWebhook = false,
  showQuickActions = false,
}) => {
  const getInitialMessages = () => {
    if (initialMessages && initialMessages.length > 0) {
      return initialMessages;
    }
    return [];
  };

  const [messages, setMessages] = useState<Message[]>(getInitialMessages());
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(
    () => initialSessionId ?? `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const hasSentInitialMessageRef = useRef(false);

  // Reset chat when resetTrigger changes
  useEffect(() => {
    if (resetTrigger > 0) {
      setMessages([]);
      setInputValue("");
      setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      hasSentInitialMessageRef.current = false;
    }
  }, [resetTrigger]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Notify parent of messages changes
  useEffect(() => {
    if (onMessagesChange) {
      onMessagesChange(messages);
    }
  }, [messages]); // Only depend on messages, not the callback

  // Notify parent of sessionId changes
  useEffect(() => {
    if (onSessionIdChange) {
      onSessionIdChange(sessionId);
    }
  }, [sessionId, onSessionIdChange]);

  // Auto-send last user message if initializing with messages
  useEffect(() => {
    // Only run once on mount if we have initialMessages
    if (initialMessages && initialMessages.length > 0 && !hasSentInitialMessageRef.current) {
      const lastMessage = initialMessages[initialMessages.length - 1];

      // If last message is from user, send it to webhook
      if (lastMessage.isUser && lastMessage.text) {
        hasSentInitialMessageRef.current = true;
        console.log("Auto-sending initial user message:", lastMessage.text);

        // Wait a brief moment to ensure component is fully mounted
        setTimeout(() => {
          sendMessageWithText(lastMessage.text);
        }, 100);
      }
    }
  }, []); // Empty deps - only run once on mount

  const sendPrefilledMessage = async (message: string) => {
    if (isLoading) return;

    setInputValue(message);

    // If skipWebhook is true, just add message without sending
    if (skipWebhook) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: message,
        isUser: true,
      };
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        const normalize = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
        if (last?.isUser && normalize(last.text) === normalize(message)) {
          return prev; // Already present, don't append again
        }
        return [...prev, userMessage];
      });
      setInputValue("");
      return;
    }

    // Small delay to show the message being set, then send it
    setTimeout(() => {
      sendMessageWithText(message);
    }, 100);
  };

  const sendMessageWithText = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
    };

    console.log("Sending message:", messageText);
    console.log("Webhook URL:", webhookUrl);
    console.log("Session ID:", sessionId);

    setMessages((prev) => {
      const last = prev[prev.length - 1];
      const normalize = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
      if (last?.isUser && normalize(last.text) === normalize(messageText)) {
        return prev; // Already present, don't append again
      }
      return [...prev, userMessage];
    });
    setInputValue("");
    setIsLoading(true);

    try {
      const requestBody = {
        message: messageText,
        sessionId: sessionId,
      };
      console.log("Request body:", JSON.stringify(requestBody));

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || "Failed to send message"}`);
      }

      const responseText = await response.text();
      console.log("Raw response text:", responseText);

      if (!responseText || responseText.trim() === "") {
        console.warn("Empty response from webhook");
        throw new Error("Empty response from server");
      }

      let data;
      try {
        data = JSON.parse(responseText);
        console.log("Parsed response data:", data);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        console.error("Response text that failed to parse:", responseText);
        throw new Error("Invalid JSON response from server");
      }

      let botResponse = "I'm sorry, I couldn't process that request.";

      if (Array.isArray(data) && data.length > 0) {
        botResponse = data[0]?.output || data[0]?.message || data[0];
      } else if (data.output) {
        botResponse = data.output;
      } else if (data.message) {
        botResponse = data.message;
      } else if (typeof data === "string") {
        botResponse = data;
      } else {
        console.warn("Unexpected response format:", data);
      }

      // Clean the response text before parsing markdown
      botResponse = cleanWebhookResponse(botResponse);

      // Optional: Warn about very long responses
      if (botResponse.length > 10000) {
        console.warn("Very long response received:", botResponse.length, "characters");
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        isUser: false,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);

      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

      const errorBotMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Error: ${errorMessage}. Please check the webhook configuration.`,
        isUser: false,
      };

      setMessages((prev) => [...prev, errorBotMessage]);

      toast({
        title: "Error",
        description: `Failed to send message: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    await sendMessageWithText(inputValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = [
    { icon: "📋", label: "What tools do you have access to?", message: "What tools do you have access to?" },
    { icon: "🎯", label: "Help me outline an AI strategy", message: "Help me outline an AI strategy" },
    { icon: "👤", label: "Tell me about Magnus", message: "Tell me about Magnus" },
    { icon: "🤖", label: "Explain AI agents to me", message: "Explain AI agents to me" },
    { icon: "✉️", label: "Contact Magnus", message: "Contact Magnus" },
    { icon: "🔒", label: "What is Private AI?", message: "What is Private AI?" },
  ];

  return (
    <div className={fullPage ? "flex flex-col h-full relative" : "max-w-3xl mx-auto"}>
      {/* Messages - scrollable area - only show when there are messages */}
      {messages.length > 0 && (
        <div
          ref={messagesContainerRef}
          className={
            fullPage
              ? "flex-1 overflow-y-auto max-w-4xl mx-auto px-6 py-6 pb-4 space-y-4 bg-gradient-to-b from-muted/50 to-background scroll-smooth"
              : "h-80 overflow-y-auto max-w-4xl mx-auto px-6 py-6 space-y-4 bg-gradient-to-b from-muted/50 to-background scroll-smooth glass-card shadow-apple"
          }
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
              data-user-message={message.isUser ? "true" : "false"}
            >
              <div
                className={`max-w-[95%] px-4 py-3 rounded-2xl ${
                  message.isUser
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted/30 text-foreground rounded-bl-md"
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
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted/30 rounded-2xl rounded-bl-md px-4 py-3">
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

      {/* Input - fixed at bottom */}
      <div className={fullPage ? "shrink-0 bg-background border-t border-border" : "glass-card shadow-apple mt-4"}>
        <div className="p-6 bg-card">
          <div className="relative max-w-4xl mx-auto">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Hi, I'm Magnet, an agent twin. How can I help you today?"
              className="w-full bg-background border border-border/50 rounded-3xl px-6 py-4 pr-16 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none text-base text-foreground placeholder:text-muted-foreground shadow-sm min-h-[120px]"
              rows={4}
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
              className="absolute bottom-3 right-3 rounded-full h-9 w-9 shadow-sm transition-opacity hover:opacity-90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Action Buttons - show below input when no messages */}
          {showQuickActions && messages.length === 0 && (
            <div className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-w-4xl mx-auto">
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    onClick={() => sendPrefilledMessage(action.message)}
                    disabled={isLoading}
                    variant="ghost"
                    className="h-auto py-2 px-3 text-xs font-normal justify-start rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span className="mr-1.5 text-sm">{action.icon}</span>
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppleChat;
