// ============================================
// useChatMessages Hook
// Manages chat message state and sending logic
// ============================================

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cleanWebhookResponse, generateSessionId, normalizeText } from "./utils";
import type { Message, SiteContext } from "./types";
import type { AIIntegrationType, AIIntegration } from "@/types/modules";

interface UseChatMessagesOptions {
  webhookUrl: string;
  initialMessages?: Message[];
  initialSessionId?: string;
  resetTrigger?: number;
  skipWebhook?: boolean;
  siteContext?: SiteContext | null;
  integration?: AIIntegrationType;
  integrationConfig?: AIIntegration;
  onMessagesChange?: (messages: Message[]) => void;
  onSessionIdChange?: (id: string) => void;
}

export const useChatMessages = ({
  webhookUrl,
  initialMessages,
  initialSessionId,
  resetTrigger = 0,
  skipWebhook = false,
  siteContext = null,
  integration = "n8n",
  integrationConfig,
  onMessagesChange,
  onSessionIdChange,
}: UseChatMessagesOptions) => {
  const getInitialMessages = () => {
    if (initialMessages && initialMessages.length > 0) {
      return initialMessages;
    }
    return [];
  };

  const [messages, setMessages] = useState<Message[]>(getInitialMessages());
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(
    () => initialSessionId ?? generateSessionId()
  );
  const hasSentInitialMessageRef = useRef(false);

  // Reset chat when resetTrigger changes
  useEffect(() => {
    if (resetTrigger > 0) {
      setMessages([]);
      setSessionId(generateSessionId());
      hasSentInitialMessageRef.current = false;
    }
  }, [resetTrigger]);

  // Notify parent of messages changes
  useEffect(() => {
    onMessagesChange?.(messages);
  }, [messages, onMessagesChange]);

  // Notify parent of sessionId changes
  useEffect(() => {
    onSessionIdChange?.(sessionId);
  }, [sessionId, onSessionIdChange]);

  const addUserMessage = useCallback((text: string): Message => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
    };

    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.isUser && normalizeText(last.text) === normalizeText(text)) {
        return prev; // Already present, don't append again
      }
      return [...prev, userMessage];
    });

    return userMessage;
  }, []);

  const addBotMessage = useCallback((text: string): Message => {
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text,
      isUser: false,
    };
    setMessages((prev) => [...prev, botMessage]);
    return botMessage;
  }, []);

  const sendMessageWithText = useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || isLoading) return;

      addUserMessage(messageText);
      setIsLoading(true);

      try {
        // Use edge function for non-n8n integrations
        if (integration !== "n8n") {
          const { data, error } = await supabase.functions.invoke("ai-chat", {
            body: {
              message: messageText,
              sessionId: sessionId,
              integration: integration,
              integrationConfig: integrationConfig,
              siteContext: siteContext,
            },
          });

          if (error) {
            throw new Error(error.message || "Failed to get AI response");
          }

          const botResponse = cleanWebhookResponse(
            data?.output || data?.message || "No response"
          );
          addBotMessage(botResponse);
          return;
        }

        // Original n8n webhook logic
        const requestBody: Record<string, unknown> = {
          message: messageText,
          sessionId: sessionId,
        };

        if (siteContext && (siteContext.pages?.length || siteContext.blogs?.length)) {
          requestBody.siteContext = siteContext;
        }

        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `HTTP ${response.status}: ${errorText || "Failed to send message"}`
          );
        }

        const responseText = await response.text();

        if (!responseText || responseText.trim() === "") {
          throw new Error("Empty response from server");
        }

        let data;
        try {
          data = JSON.parse(responseText);
        } catch {
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
        }

        botResponse = cleanWebhookResponse(botResponse);
        addBotMessage(botResponse);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";

        addBotMessage(`Error: ${errorMessage}. Please check the webhook configuration.`);

        toast({
          title: "Error",
          description: `Failed to send message: ${errorMessage}`,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [
      isLoading,
      sessionId,
      integration,
      integrationConfig,
      siteContext,
      webhookUrl,
      addUserMessage,
      addBotMessage,
    ]
  );

  const sendPrefilledMessage = useCallback(
    async (message: string) => {
      if (isLoading) return;

      if (skipWebhook) {
        addUserMessage(message);
        return;
      }

      await sendMessageWithText(message);
    },
    [isLoading, skipWebhook, addUserMessage, sendMessageWithText]
  );

  // Auto-send last user message if initializing with messages
  useEffect(() => {
    if (
      initialMessages &&
      initialMessages.length > 0 &&
      !hasSentInitialMessageRef.current
    ) {
      const lastMessage = initialMessages[initialMessages.length - 1];

      if (lastMessage.isUser && lastMessage.text) {
        hasSentInitialMessageRef.current = true;
        setTimeout(() => {
          sendMessageWithText(lastMessage.text);
        }, 100);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    messages,
    isLoading,
    sessionId,
    sendMessage: sendMessageWithText,
    sendPrefilledMessage,
  };
};
