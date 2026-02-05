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

// Fetch all sessions with summary info
export const fetchChatSessions = async (
  limit = 50,
  offset = 0
): Promise<{ sessions: ChatSession[]; total: number }> => {
  // Get unique sessions with first message and counts
  const { data, error } = await supabase
    .from("chat_messages")
    .select("session_id, role, content, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching chat sessions:", error);
    return { sessions: [], total: 0 };
  }

  // Group by session_id
  const sessionMap = new Map<string, ChatMessageRecord[]>();
  for (const msg of data || []) {
    const existing = sessionMap.get(msg.session_id) || [];
    existing.push(msg as ChatMessageRecord);
    sessionMap.set(msg.session_id, existing);
  }

  // Build session summaries
  const sessions: ChatSession[] = [];
  for (const [sessionId, messages] of sessionMap) {
    const sorted = messages.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const firstUserMsg = sorted.find((m) => m.role === "user");
    
    sessions.push({
      session_id: sessionId,
      first_message: firstUserMsg?.content.slice(0, 100) || "No message",
      message_count: messages.length,
      started_at: sorted[0].created_at,
      last_message_at: sorted[sorted.length - 1].created_at,
    });
  }

  // Sort by most recent
  sessions.sort(
    (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
  );

  const total = sessions.length;
  const paginated = sessions.slice(offset, offset + limit);

  return { sessions: paginated, total };
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
