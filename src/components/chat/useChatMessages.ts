// ============================================
// useChatMessages Hook
// Manages chat message state and sending logic
// ============================================

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cleanWebhookResponse, generateSessionId, normalizeText } from "./utils";
import { optimizeMessagesForApi } from "./messageOptimizer";
import { saveChatMessage } from "@/data/chatMessages";
import type { Message, SiteContext, ChatMessage, ChatArtifact, ChatMode } from "./types";
import type { AIIntegrationType, AIIntegration } from "@/types/modules";
import { trackChatSession, updateChatSession } from "@/models/analytics";

// ---- Chrome Extension Bridge ----
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chromeRuntime = (window as any).chrome?.runtime;

async function executeClientAction(action: {
  tool_name: string;
  tool_args: Record<string, unknown>;
}): Promise<string> {
  const extensionId = localStorage.getItem('mycms_extension_id');
  if (!extensionId || !chromeRuntime?.sendMessage) {
    return JSON.stringify({ error: 'Chrome extension not configured. Set the Extension ID in Settings → Chrome Extension Bridge.' });
  }

  return new Promise((resolve) => {
    const messageType = action.tool_args.url ? 'navigate_and_scrape' : 'scrape_active_tab';
    const payload: Record<string, unknown> = { type: messageType };
    if (action.tool_args.url) payload.url = action.tool_args.url;

    try {
      chromeRuntime.sendMessage(extensionId, payload, (response: unknown) => {
        if (chromeRuntime.lastError) {
          resolve(JSON.stringify({ error: chromeRuntime.lastError.message || 'Extension not reachable' }));
          return;
        }
        const res = response as { success?: boolean; data?: unknown; error?: string };
        if (res?.success) {
          resolve(JSON.stringify(res.data));
        } else {
          resolve(JSON.stringify({ error: res?.error || 'Scrape failed' }));
        }
      });
    } catch {
      resolve(JSON.stringify({ error: 'Failed to communicate with Chrome extension' }));
    }
  });
}

interface UseChatMessagesOptions {
  webhookUrl: string;
  initialMessages?: Message[];
  initialSessionId?: string;
  resetTrigger?: number;
  skipWebhook?: boolean;
  siteContext?: SiteContext | null;
  systemPrompt?: string;
  integration?: AIIntegrationType;
  integrationConfig?: AIIntegration;
  enabledTools?: string[];
  mode?: ChatMode;
  onMessagesChange?: (messages: Message[]) => void;
  onSessionIdChange?: (id: string) => void;
}

// Convert UI messages to API format
const toApiMessages = (messages: Message[]): ChatMessage[] => {
  return messages.map((m) => ({
    role: m.isUser ? 'user' : 'assistant',
    content: m.text,
  }));
};

export const useChatMessages = ({
  webhookUrl,
  initialMessages,
  initialSessionId,
  resetTrigger = 0,
  skipWebhook = false,
  siteContext = null,
  systemPrompt = '',
  integration = "n8n",
  integrationConfig,
  enabledTools,
  mode = 'public',
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
  const analyticsSessionIdRef = useRef<string | null>(null);
  const messageCountRef = useRef(0);

  // Track chat session on first message
  const ensureChatSessionTracked = useCallback(async () => {
    if (!analyticsSessionIdRef.current) {
      try {
        const id = await trackChatSession();
        analyticsSessionIdRef.current = id;
      } catch (e) {
        console.warn('Failed to track chat session:', e);
      }
    }
  }, []);

  // Update session with message count
  const updateSessionMessageCount = useCallback(async (count: number) => {
    if (analyticsSessionIdRef.current) {
      try {
        await updateChatSession(analyticsSessionIdRef.current, count);
      } catch (e) {
        console.warn('Failed to update chat session:', e);
      }
    }
  }, []);

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

  const addBotMessage = useCallback((text: string, artifacts?: ChatArtifact[]): Message => {
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text,
      isUser: false,
      artifacts,
    };
    setMessages((prev) => [...prev, botMessage]);
    return botMessage;
  }, []);

  const sendMessageWithText = useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || isLoading) return;

      // Track chat session on first message
      await ensureChatSessionTracked();

      addUserMessage(messageText);
      messageCountRef.current += 1;
      setIsLoading(true);
      
      // Save user message to database for history
      saveChatMessage(sessionId, 'user', messageText);

      try {
        // Build full conversation history for API
        // Note: We need to get current messages + the new user message
        const currentMessages = [...messages, { id: Date.now().toString(), text: messageText, isUser: true }];
        const apiMessages = toApiMessages(currentMessages);
        
        // Optimize messages: summarize older ones to reduce payload size
        const optimizedMessages = optimizeMessagesForApi(apiMessages);

        // All integrations now go through edge function for consistency
        const { data, error } = await supabase.functions.invoke("ai-chat", {
          body: {
            messages: optimizedMessages,
            sessionId: sessionId,
            systemPrompt: systemPrompt,
            integration: {
              type: integration,
              ...(integrationConfig || {}),
              webhook_url: integration === 'n8n' ? webhookUrl : undefined,
            },
            siteContext: siteContext,
            enabledTools: enabledTools,
            mode: mode,
          },
        });

        if (error) {
          throw new Error(error.message || "Failed to get AI response");
        }

        // Handle client-side tool execution (e.g. Chrome extension)
        if (data?.client_action) {
          const statusMsg = cleanWebhookResponse(data.output || 'Working on it…');
          const workingMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: statusMsg,
            isUser: false,
            status: 'working',
          };
          setMessages((prev) => [...prev, workingMessage]);

          // Execute client-side tool
          const toolResult = await executeClientAction(data.client_action);

          // Re-send with the tool result injected into conversation
          const conversationState = data.client_action.conversation_state || [];
          // Add tool result to conversation
          conversationState.push({
            role: 'tool',
            content: toolResult,
            tool_call_id: `client_${data.client_action.tool_name}`,
          });

          const { data: followUpData, error: followUpError } = await supabase.functions.invoke("ai-chat", {
            body: {
              messages: conversationState.filter((m: Record<string, unknown>) => m.role !== 'system'),
              sessionId: sessionId,
              systemPrompt: systemPrompt,
              integration: {
                type: integration,
                ...(integrationConfig || {}),
                webhook_url: integration === 'n8n' ? webhookUrl : undefined,
              },
              siteContext: siteContext,
              enabledTools: enabledTools,
              mode: mode,
              _resumeConversation: true,
            },
          });

          if (followUpError) throw new Error(followUpError.message);

          const followUpResponse = cleanWebhookResponse(followUpData?.output || "Done.");
          const followUpArtifacts = followUpData?.artifacts as ChatArtifact[] | undefined;
          
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              id: (Date.now() + 2).toString(),
              text: followUpResponse,
              isUser: false,
              artifacts: followUpArtifacts,
              status: 'done',
            };
            return updated;
          });
          messageCountRef.current += 1;
          saveChatMessage(sessionId, 'assistant', followUpResponse);
        } else {
          const botResponse = cleanWebhookResponse(
            data?.output || data?.message || "No response"
          );
          const artifacts = data?.artifacts as ChatArtifact[] | undefined;
          addBotMessage(botResponse, artifacts);
          messageCountRef.current += 1;
          saveChatMessage(sessionId, 'assistant', botResponse);
        }

        // Update analytics with message count
        await updateSessionMessageCount(messageCountRef.current);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";

        addBotMessage(`Error: ${errorMessage}. Please check the configuration.`);

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
      messages,
      sessionId,
      systemPrompt,
      integration,
      integrationConfig,
      webhookUrl,
      siteContext,
      enabledTools,
      mode,
      addUserMessage,
      addBotMessage,
      ensureChatSessionTracked,
      updateSessionMessageCount,
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
