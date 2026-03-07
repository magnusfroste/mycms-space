import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, MessageSquarePlus } from "lucide-react";
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

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { config: aiConfig } = useAIModule();
  const { contextData, isLoading: contextLoading } = useAIChatContext();
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
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/")} className="flex items-center gap-2 hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>

          <h1 className="text-lg font-semibold bg-gradient-to-r from-apple-purple to-apple-blue bg-clip-text text-transparent">
            Chat with Magnet
          </h1>

          <Button variant="outline" onClick={() => setShowNewChatDialog(true)} className="flex items-center gap-2">
            <MessageSquarePlus className="h-4 w-4" />
            <span>New Chat</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        {hasInitialMessages && !contextReady ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Loading context...</span>
            </div>
          </div>
        ) : (
          <ChatInterface
            webhookUrl={webhookUrl}
            fullPage={true}
            initialPlaceholder={passedPlaceholder || "Hi, I'm Magnet, Magnus agentic twin. How can I help you today?"}
            activePlaceholder={passedPlaceholder || "How can Magnet help?"}
            initialMessages={initialMessages}
            initialSessionId={initialSessionId}
            resetTrigger={resetTrigger}
            showQuickActions={true}
            siteContext={contextData}
            integration={configuredIntegration}
            integrationConfig={aiConfig?.integration}
            systemPrompt={aiConfig?.system_prompt || ''}
            enabledTools={(aiConfig?.magnet_tools || defaultMagnetTools).filter(t => t.enabled).map(t => t.id)}
            mode="public"
          />
        )}
      </main>

      <AlertDialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start a new chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear your current conversation. This action cannot be undone.
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
