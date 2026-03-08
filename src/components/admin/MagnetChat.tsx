// ============================================
// Magnet Chat - Admin AI Co-Pilot
// OpenRouter-inspired layout with sidebar
// ============================================

import React, { useState, useCallback } from "react";
import { ChatInterface } from "@/components/chat";
import { useAIModule } from "@/models/modules";
import { useAIChatContext } from "@/hooks/useAIChatContext";
import { Badge } from "@/components/ui/badge";
import { Database, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { integrationsMeta, defaultAdminMagnetTools, type AIIntegrationType } from "@/types/modules";
import { useChromeExtensionModule } from "@/models/modules";
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
  headerSlot?: React.ReactNode;
}

const MagnetChat: React.FC<MagnetChatProps> = ({ headerSlot }) => {
  const { config: aiConfig } = useAIModule();
  const { config: extConfig } = useChromeExtensionModule();
  const { contextData, contextSummary, hasContext } = useAIChatContext();
  const [resetTrigger, setResetTrigger] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const configuredIntegration = aiConfig?.active_integration || 'openai';
  const [overrideIntegration, setOverrideIntegration] = useState<AIIntegrationType | null>(null);
  const effectiveIntegration = overrideIntegration || configuredIntegration;

  const availableIntegrations = integrationsMeta.filter(
    (meta) => meta.category === 'ai' && meta.available
  );
  const selectedMeta = availableIntegrations.find(m => m.type === effectiveIntegration);

  const webhookUrl = effectiveIntegration === 'n8n'
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

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Sidebar */}
      <ChatSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleNewChat}
        activeSessionId={activeSessionId}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {headerSlot}
        {/* Compact toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border h-10">
          <div className="flex items-center gap-2 min-w-0">
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
                    onClick={() => setOverrideIntegration(meta.type as AIIntegrationType)}
                    className={effectiveIntegration === meta.type ? 'bg-accent' : ''}
                  >
                    {meta.name}
                  </DropdownMenuItem>
                ))}
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
              integration={effectiveIntegration}
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
