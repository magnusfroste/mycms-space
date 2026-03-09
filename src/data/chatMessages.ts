// ============================================
// Chat Messages Data Layer
// Supabase API calls for chat message storage
// ============================================

import { supabase } from "@/integrations/supabase/client";

export interface ChatMessageRecord {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ChatSession {
  session_id: string;
  first_message: string;
  message_count: number;
  started_at: string;
  last_message_at: string;
}

// Save a single message
export const saveChatMessage = async (
  sessionId: string,
  role: "user" | "assistant",
  content: string
): Promise<void> => {
  const { error } = await supabase
    .from("chat_messages")
    .insert({ session_id: sessionId, role, content });

  if (error) {
    console.warn("Failed to save chat message:", error);
  }
};

// Fetch all messages for a session
export const fetchSessionMessages = async (
  sessionId: string
): Promise<ChatMessageRecord[]> => {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching session messages:", error);
    return [];
  }

  return (data || []) as ChatMessageRecord[];
};

// Fetch all sessions with summary info via server-side SQL function
export const fetchChatSessions = async (
  limit = 50,
  offset = 0
): Promise<{ sessions: ChatSession[]; total: number }> => {
  const { data, error } = await supabase.rpc("get_chat_sessions", {
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    console.error("Error fetching chat sessions:", error);
    return { sessions: [], total: 0 };
  }

  const sessions: ChatSession[] = (data || []).map((row: any) => ({
    session_id: row.session_id,
    first_message: (row.first_message || "No message").slice(0, 100),
    message_count: Number(row.message_count),
    started_at: row.started_at,
    last_message_at: row.last_message_at,
  }));

  return { sessions, total: sessions.length };
};

// Delete messages older than specified days
export const deleteOldMessages = async (daysOld = 90): Promise<number> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const { data, error } = await supabase
    .from("chat_messages")
    .delete()
    .lt("created_at", cutoffDate.toISOString())
    .select("id");

  if (error) {
    console.error("Error deleting old messages:", error);
    return 0;
  }

  return data?.length || 0;
};

// Delete all messages for a specific session
export const deleteSession = async (sessionId: string): Promise<boolean> => {
  const { error } = await supabase
    .from("chat_messages")
    .delete()
    .eq("session_id", sessionId);

  if (error) {
    console.error("Error deleting session:", error);
    return false;
  }
  return true;
};
