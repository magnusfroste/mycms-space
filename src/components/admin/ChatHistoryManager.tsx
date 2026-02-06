// ============================================
// Chat History Manager
// Admin component to view chat conversation history
// ============================================

import React, { useState } from "react";
import { format } from "date-fns";
import { MessageSquare, ChevronRight, Trash2, User, Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import {
  useChatSessions,
  useSessionMessages,
  useDeleteOldMessages,
} from "@/models/chatMessages";

const ChatHistoryManager: React.FC = () => {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const { data: sessionsData, isLoading: loadingSessions } = useChatSessions();
  const { data: messages, isLoading: loadingMessages } = useSessionMessages(selectedSessionId);
  const deleteOldMutation = useDeleteOldMessages();

  const sessions = sessionsData?.sessions || [];

  const handleCleanup = async () => {
    try {
      const deleted = await deleteOldMutation.mutateAsync(90);
      toast.success(`Deleted ${deleted} old messages`);
    } catch {
      toast.error('Failed to delete old messages');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Chat History</h2>
          <p className="text-muted-foreground">
            View conversation history from AI chat widget
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Cleanup (90+ days)
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete old messages?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all chat messages older than 90 days.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleCleanup}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{sessionsData?.total || 0}</div>
            <p className="text-sm text-muted-foreground">Total Sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {sessions.reduce((sum, s) => sum + s.message_count, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Total Messages</p>
          </CardContent>
        </Card>
      </div>

      {/* Main content */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Sessions list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {loadingSessions ? (
                <div className="p-4 text-center text-muted-foreground">Loading...</div>
              ) : sessions.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No chat sessions yet
                </div>
              ) : (
                <div className="divide-y">
                  {sessions.map((session) => (
                    <button
                      key={session.session_id}
                      onClick={() => setSelectedSessionId(session.session_id)}
                      className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                        selectedSessionId === session.session_id ? "bg-muted" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {session.first_message}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(session.started_at), "MMM d, HH:mm")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{session.message_count}</Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Message detail */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {!selectedSessionId ? (
                <div className="p-4 text-center text-muted-foreground">
                  Select a session to view messages
                </div>
              ) : loadingMessages ? (
                <div className="p-4 text-center text-muted-foreground">Loading...</div>
              ) : !messages?.length ? (
                <div className="p-4 text-center text-muted-foreground">
                  No messages in this session
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${
                        msg.role === "user" ? "" : "flex-row-reverse"
                      }`}
                    >
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={`flex-1 rounded-lg p-3 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            msg.role === "user"
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {format(new Date(msg.created_at), "HH:mm:ss")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChatHistoryManager;
