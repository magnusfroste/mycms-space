import React from "react";
import { Link, useLocation } from "react-router-dom";
import { SquarePen } from "lucide-react";
import { ChatInterface } from "@/components/chat";
import { useAIModule, useHeaderModule } from "@/models/modules";
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
import SEOHead from "@/components/common/SEOHead";
import { useChromeExtensionModule } from "@/models/modules";

// Starting points for visitors (clients and recruiters), shown under the composer.
const SUGGESTIONS = [
  { id: "work", label: "What does Magnus work on?", message: "What does Magnus work on, and what kind of assignments does he take?", icon: "Briefcase", order_index: 0, enabled: true },
  { id: "available", label: "Is he available?", message: "Is Magnus available for a new assignment or role right now?", icon: "Calendar", order_index: 1, enabled: true },
  { id: "fit", label: "Check fit for a role", message: "I'd like to check how well Magnus fits a role. I'll paste the job description next.", icon: "FileText", order_index: 2, enabled: true },
  { id: "ai", label: "His work with AI agents", message: "What has Magnus built with AI agents? Give concrete examples.", icon: "Lightbulb", order_index: 3, enabled: true },
];

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

const Chat = () => {
  const { config: headerConfig } = useHeaderModule();
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
  const [hasMessages, setHasMessages] = React.useState(hasInitialMessages);
  const handleMessagesChange = React.useCallback((msgs: Message[]) => setHasMessages(msgs.length > 0), []);
  const startNewChat = () => (hasMessages ? setShowNewChatDialog(true) : setResetTrigger((n) => n + 1));
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
    <div className="flex h-dvh flex-col bg-background">
      <SEOHead
        title="Chat with Magnet"
        description="Ask Magnet, Magnus Froste's AI agent, about his experience, projects and availability."
      />
      <header className="flex h-14 shrink-0 items-center justify-between px-3 sm:px-4">
        {/* Same wordmark as the site header and the admin: "froste.eu / Magnet" */}
        <div className="flex min-w-0 items-center gap-2 pl-1">
          <Link
            to="/"
            className="shrink-0 text-[15px] font-bold tracking-[-0.01em] text-foreground"
            title="Back to the site"
          >
            {headerConfig?.logo_text || "froste.eu"}
          </Link>
          <span className="text-border" aria-hidden="true">/</span>
          <span className="truncate text-[15px] font-medium text-foreground">Magnet</span>
          <span className="hidden truncate text-[13px] text-muted-foreground md:inline">· Magnus Froste's AI twin</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={startNewChat}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="New chat"
            title="New chat"
          >
            <SquarePen className="h-[18px] w-[18px]" />
          </button>
          <Link
            to="/contact"
            className="inline-flex h-9 items-center rounded-full bg-foreground px-4 text-[13.5px] font-medium text-background transition-opacity hover:opacity-85"
          >
            Contact<span className="hidden sm:inline">&nbsp;Magnus</span>
          </Link>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        {hasMessages && <h1 className="sr-only">Chat with Magnet, Magnus Froste's AI agent</h1>}
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
            initialPlaceholder={passedPlaceholder || "Ask anything about Magnus…"}
            activePlaceholder="Ask a follow-up…"
            emptyTitle="What would you like to know about Magnus?"
            emptySubtitle="Magnet answers from his CV, projects and writing. Paste a job description to check the fit."
            footerNote={
              <>
                Magnet is an AI and can make mistakes. For anything important,{" "}
                <Link to="/contact" className="underline underline-offset-2 hover:text-foreground">contact Magnus</Link>.
              </>
            }
            quickActions={SUGGESTIONS}
            initialMessages={initialMessages}
            initialSessionId={initialSessionId}
            resetTrigger={resetTrigger}
            onMessagesChange={handleMessagesChange}
            showQuickActions={true}
            siteContext={enrichedContext}
            integration={configuredIntegration}
            integrationConfig={aiConfig?.integration}
            systemPrompt={aiConfig?.system_prompt || ''}
            enabledTools={(aiConfig?.magnet_tools || defaultMagnetTools).filter(t => t.enabled).map(t => t.id)}
            mode="public"
            extensionId={extConfig?.extension_id}
            voiceEnabled={aiConfig?.voice_enabled ?? false}
            ttsVoice={aiConfig?.tts_voice}
            visitorConfig={{
              enabled: aiConfig?.visitor_insights_enabled,
              power_user_visits: aiConfig?.visitor_power_user_visits,
              power_user_pages: aiConfig?.visitor_power_user_pages,
              exploring_visits: aiConfig?.visitor_exploring_visits,
              exploring_pages: aiConfig?.visitor_exploring_pages,
              show_artifact: aiConfig?.visitor_show_artifact,
            }}
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
