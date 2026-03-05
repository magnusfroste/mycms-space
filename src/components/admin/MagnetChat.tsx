import React from "react";
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

const adminQuickActions = [
  { label: "📊 Show me this week's stats", message: "Show me this week's site stats — traffic, messages, and engagement." },
  { label: "🔍 Research AI trends", message: "Research the latest AI agent trends and summarize the key findings." },
  { label: "✍️ Draft a blog post", message: "Draft a blog post about a trending topic from recent research." },
  { label: "📬 What's in my review queue?", message: "What tasks are pending in my review queue right now?" },
  { label: "📰 Draft newsletter", message: "Draft a newsletter from recent research and published blog posts." },
];

const MagnetChat: React.FC = () => {
  const { config: aiConfig } = useAIModule();
  const { contextData, contextSummary, hasContext } = useAIChatContext();
  const [resetTrigger, setResetTrigger] = React.useState(0);

  const configuredIntegration = aiConfig?.active_integration || 'openai';
  const [selectedIntegration, setSelectedIntegration] = React.useState<AIIntegrationType>(configuredIntegration);

  const availableIntegrations = integrationsMeta.filter(
    (meta) => meta.category === 'ai' && meta.available
  );
  const selectedMeta = availableIntegrations.find(m => m.type === selectedIntegration);

  const webhookUrl = selectedIntegration === 'n8n'
    ? (aiConfig?.webhook_url || "https://agent.froste.eu/webhook/magnet")
    : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Compact toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">Magnet Co-Pilot</h2>
          {hasContext && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Database className="h-3 w-3" />
              {contextSummary}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
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
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setResetTrigger(prev => prev + 1)}
          >
            New chat
          </Button>
        </div>
      </div>

      {/* Chat interface */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          webhookUrl={webhookUrl}
          fullPage={true}
          initialPlaceholder="Hey Magnus, what should we work on today?"
          activePlaceholder="What's next?"
          quickActions={adminQuickActions}
          showQuickActions={true}
          resetTrigger={resetTrigger}
          siteContext={contextData}
          integration={selectedIntegration}
          integrationConfig={aiConfig?.integration}
          systemPrompt={aiConfig?.system_prompt || ''}
          enabledTools={defaultAdminMagnetTools.filter(t => t.enabled).map(t => t.id)}
          mode="admin"
        />
      </div>
    </div>
  );
};

export default MagnetChat;
