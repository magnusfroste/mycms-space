// ============================================
// Magnet Chat - Admin AI Co-Pilot
// OpenRouter-inspired layout with sidebar
// ============================================

import React, { useState, useCallback } from "react";
import { ChatInterface } from "@/components/chat";
import { useAIModule } from "@/models/modules";
import { useAIChatContext } from "@/hooks/useAIChatContext";
import { Badge } from "@/components/ui/badge";
import { Database, ChevronDown, LogOut, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { integrationsMeta, defaultAdminMagnetTools, type AIIntegrationType } from "@/types/modules";
import { useChromeExtensionModule } from "@/models/modules";
import { useAuth } from "@/hooks/useAuth";
import { useSessionMessages } from "@/models/chatMessages";
import ChatSidebar from "./ChatSidebar";
import type { Message } from "@/components/chat/types";

const adminQuickActions = [
  { id: 'stats', label: '📊 This week\'s stats', message: 'Show me this week\'s site stats — traffic, messages, and engagement.', icon: 'BarChart', order_index: 0, enabled: true },
  { id: 'research', label: '🔍 Research AI trends', message: 'Research the latest AI agent trends and summarize the key findings.', icon: 'Search', order_index: 1, enabled: true },
  { id: 'draft-blog', label: '✍️ Draft blog post', message: 'Draft a blog post about a trending topic from recent research.', icon: 'PenSquare', order_index: 2, enabled: true },
  { id: 'review', label: '📬 Review queue', message: 'What tasks are pending in my review queue right now?', icon: 'Inbox', order_index: 3, enabled: true },
  { id: 'newsletter', label: '📰 Draft newsletter', message: 'Draft a newsletter from recent research and published blog posts.', icon: 'Mail', order_index: 4, enabled: true },
];

interface MagnetChatProps {
  onNavigateBack?: () => void;
}

const MagnetChat: React.FC<MagnetChatProps> = ({ onNavigateBack }) => {
  const { config: aiConfig } = useAIModule();
  const { config: extConfig } = useChromeExtensionModule();
  const { contextData, contextSummary, hasContext } = useAIChatContext();
  const { user, signOut } = useAuth();
  const [resetTrigger, setResetTrigger] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const configuredIntegration = aiConfig?.active_integration || 'openai';
  const [selectedIntegration, setSelectedIntegration] = useState<AIIntegrationType>(configuredIntegration);

  const availableIntegrations = integrationsMeta.filter(
    (meta) => meta.category === 'ai' && meta.available
  );
  const selectedMeta = availableIntegrations.find(m => m.type === selectedIntegration);

  const webhookUrl = selectedIntegration === 'n8n'
    ? (aiConfig?.webhook_url || "https://agent.froste.eu/webhook/magnet")
    : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

  // Load historical session messages
  const { data: sessionMessages, isLoading: sessionLoading } = useSessionMessages(activeSessionId);

  const initialMessages: Message[] | undefined = activeSessionId && sessionMessages
    ? sessionMessages.map((m) => ({
        id: m.id,
        text: m.content,
        isUser: m.role === "user",
      }))
    : undefined;

  // Use a stable key that only updates when session data is ready
  const chatKey = activeSessionId
    ? (sessionLoading ? null : `session-${activeSessionId}`)
    : `new-${resetTrigger}`;

  const handleNewChat = useCallback(() => {
    setActiveSessionId(null);
    setResetTrigger((prev) => prev + 1);
  }, []);

  const handleSelectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  // User initials for avatar
  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "AD";

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <ChatSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        activeSessionId={activeSessionId}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Compact toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border h-12">
          <div className="flex items-center gap-2 min-w-0">
            {onNavigateBack && (
              <Button variant="ghost" size="sm" onClick={onNavigateBack} className="gap-1 h-7 text-xs text-muted-foreground shrink-0">
                <ArrowLeft className="h-3.5 w-3.5" />
                Dashboard
              </Button>
            )}
            <h2 className="text-sm font-medium text-muted-foreground truncate">Magnet</h2>
            {hasContext && (
              <Badge variant="secondary" className="text-xs gap-1 shrink-0">
                <Database className="h-3 w-3" />
                {contextSummary}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 h-7 text-xs">
                  {selectedMeta?.name || 'Select AI'}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border-border">
                {availableIntegrations.map((meta) => (
                  <DropdownMenuItem
                    key={meta.type}
                    onClick={() => setSelectedIntegration(meta.type as AIIntegrationType)}
                    className={selectedIntegration === meta.type ? 'bg-accent' : ''}
                  >
                    {meta.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full p-0">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[10px] font-semibold bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border-border w-48">
                <div className="px-2 py-1.5">
                  <p className="text-xs font-medium truncate">{user?.email}</p>
                  <p className="text-[10px] text-muted-foreground">Admin</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="text-xs gap-2">
                  <LogOut className="h-3 w-3" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Chat interface */}
        <div className="flex-1 overflow-hidden">
          {chatKey === null ? (
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                <span className="text-xs uppercase tracking-wider">Loading conversation</span>
              </div>
            </div>
          ) : (
            <ChatInterface
              key={chatKey}
              webhookUrl={webhookUrl}
              fullPage={true}
              initialPlaceholder="Hey Magnus, what should we work on today?"
              activePlaceholder="What's next?"
              quickActions={adminQuickActions}
              showQuickActions={!activeSessionId}
              resetTrigger={resetTrigger}
              initialMessages={initialMessages}
              initialSessionId={activeSessionId ?? undefined}
              siteContext={contextData}
              integration={selectedIntegration}
              integrationConfig={aiConfig?.integration}
              systemPrompt={aiConfig?.system_prompt || ''}
              enabledTools={defaultAdminMagnetTools.filter(t => t.enabled).map(t => t.id)}
              mode="admin"
              extensionId={extConfig?.extension_id}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MagnetChat;
