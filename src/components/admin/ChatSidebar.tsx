// ============================================
// Chat Sidebar Component
// OpenRouter-inspired collapsible sidebar with
// searchable chat history for admin
// ============================================

import React, { useState, useMemo } from "react";
import { Search, Plus, MessageSquare, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useChatSessions } from "@/models/chatMessages";
import { formatDistanceToNow } from "date-fns";

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  activeSessionId?: string | null;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isOpen,
  onToggle,
  onNewChat,
  onSelectSession,
  activeSessionId,
}) => {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useChatSessions(100, 0);

  const sessions = useMemo(() => {
    const all = data?.sessions || [];
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter((s) => s.first_message.toLowerCase().includes(q));
  }, [data?.sessions, search]);

  // Group sessions by time
  const grouped = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const weekAgo = new Date(today.getTime() - 7 * 86400000);

    const groups: { label: string; items: typeof sessions }[] = [
      { label: "Today", items: [] },
      { label: "Yesterday", items: [] },
      { label: "This week", items: [] },
      { label: "Older", items: [] },
    ];

    for (const s of sessions) {
      const d = new Date(s.last_message_at);
      if (d >= today) groups[0].items.push(s);
      else if (d >= yesterday) groups[1].items.push(s);
      else if (d >= weekAgo) groups[2].items.push(s);
      else groups[3].items.push(s);
    }

    return groups.filter((g) => g.items.length > 0);
  }, [sessions]);

  if (!isOpen) {
    return (
      <div className="flex flex-col items-center py-3 px-1 border-r border-border bg-muted/30 w-12 shrink-0">
        <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8 mb-2">
          <PanelLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onNewChat} className="h-8 w-8">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-64 shrink-0 border-r border-border bg-muted/30">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={onNewChat}
          className="gap-1.5 h-7 text-xs font-medium"
        >
          <Plus className="h-3.5 w-3.5" />
          New Chat
        </Button>
        <Button variant="ghost" size="icon" onClick={onToggle} className="h-7 w-7">
          <PanelLeftClose className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats…"
            className="h-8 pl-8 text-xs bg-background/50"
          />
        </div>
      </div>

      {/* Sessions list */}
      <ScrollArea className="flex-1">
        <div className="px-2 pb-2">
          {isLoading ? (
            <div className="space-y-2 px-1 pt-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 bg-muted/50 rounded animate-pulse" />
              ))}
            </div>
          ) : grouped.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              {search ? "No matching chats" : "No chat history yet"}
            </p>
          ) : (
            grouped.map((group) => (
              <div key={group.label} className="mt-3 first:mt-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1">
                  {group.label}
                </p>
                {group.items.map((session) => (
                  <button
                    key={session.session_id}
                    onClick={() => onSelectSession(session.session_id)}
                    className={cn(
                      "w-full text-left px-2 py-1.5 rounded-md text-xs truncate transition-colors",
                      "hover:bg-accent/50",
                      activeSessionId === session.session_id
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground/80"
                    )}
                  >
                    <span className="truncate block">{session.first_message}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(session.last_message_at), { addSuffix: true })}
                    </span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatSidebar;
