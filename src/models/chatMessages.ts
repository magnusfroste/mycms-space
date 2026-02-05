// ============================================
// Chat Messages Model Layer
// React Query hooks for chat message data
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchChatSessions,
  fetchSessionMessages,
  deleteOldMessages,
  type ChatSession,
  type ChatMessageRecord,
} from "@/data/chatMessages";

// Query keys
const CHAT_SESSIONS_KEY = ["chat-sessions"];
const CHAT_MESSAGES_KEY = ["chat-messages"];

// Fetch all chat sessions
export const useChatSessions = (limit = 50, offset = 0) => {
  return useQuery({
    queryKey: [...CHAT_SESSIONS_KEY, limit, offset],
    queryFn: () => fetchChatSessions(limit, offset),
  });
};

// Fetch messages for a specific session
export const useSessionMessages = (sessionId: string | null) => {
  return useQuery({
    queryKey: [...CHAT_MESSAGES_KEY, sessionId],
    queryFn: () => fetchSessionMessages(sessionId!),
    enabled: !!sessionId,
  });
};

// Delete old messages mutation
export const useDeleteOldMessages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (daysOld: number) => deleteOldMessages(daysOld),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_SESSIONS_KEY });
    },
  });
};

export type { ChatSession, ChatMessageRecord };
