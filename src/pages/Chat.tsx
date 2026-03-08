import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatInterface } from "@/components/chat";
import { useAIModule } from "@/models/modules";
import { useAIChatContext } from "@/hooks/useAIChatContext";
import { useVisitorInsights, formatVisitorInsightsForAI } from "@/hooks/useVisitorInsights";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { defaultMagnetTools } from "@/types/modules";
import { useChromeExtensionModule } from "@/models/modules";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { config: aiConfig } = useAIModule();
  const { config: extConfig } = useChromeExtensionModule();
  const { contextData, isLoading: contextLoading } = useAIChatContext();
  const visitorInsights = useVisitorInsights();
  const enrichedContext = React.useMemo(() => ({
    ...contextData,
    visitorInsights: formatVisitorInsightsForAI(visitorInsights) as any,
  }), [contextData, visitorInsights]);
  const [showNewChatDialog, setShowNewChatDialog] = React.useState(false);
  const [resetTrigger, setResetTrigger] = React.useState(0);

  const hasInitialMessages = Boolean(location.state?.messages?.length);
  const [contextReady, setContextReady] = React.useState(!hasInitialMessages);

  React.useEffect(() => {
    if (hasInitialMessages && !contextLoading && !contextReady) {
      setContextReady(true);
    }
  }, [hasInitialMessages, contextLoading, contextReady]);

  const configuredIntegration = aiConfig?.active_integration || 'openai';
  const webhookUrl = configuredIntegration === 'n8n'
    ? (aiConfig?.webhook_url || "https://agent.froste.eu/webhook/magnet")
    : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

  const initialMessages = contextReady ? (location.state?.messages as Message[] | undefined) : undefined;
  const initialSessionId = location.state?.sessionId as string | undefined;
  const passedPlaceholder = location.state?.placeholder as string | undefined;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Grok-inspired minimal header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
        <div className="container mx-auto px-4 h-12 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-transparent"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>

          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
            Magnet
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNewChatDialog(true)}
            className="gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-transparent"
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        {hasInitialMessages && !contextReady ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
              <span className="text-xs uppercase tracking-wider">Loading</span>
            </div>
          </div>
        ) : (
          <ChatInterface
            webhookUrl={webhookUrl}
            fullPage={true}
            initialPlaceholder={passedPlaceholder || "Ask me anything…"}
            activePlaceholder={passedPlaceholder || "Continue…"}
            initialMessages={initialMessages}
            initialSessionId={initialSessionId}
            resetTrigger={resetTrigger}
            showQuickActions={true}
            siteContext={enrichedContext}
            integration={configuredIntegration}
            integrationConfig={aiConfig?.integration}
            systemPrompt={aiConfig?.system_prompt || ''}
            enabledTools={(aiConfig?.magnet_tools || defaultMagnetTools).filter(t => t.enabled).map(t => t.id)}
            mode="public"
            extensionId={extConfig?.extension_id}
          />
        )}
      </main>

      <AlertDialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start a new chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear your current conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setResetTrigger(prev => prev + 1); setShowNewChatDialog(false); }}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Chat;
