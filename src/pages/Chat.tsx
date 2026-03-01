import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, MessageSquarePlus, Database, ChevronDown, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatInterface } from "@/components/chat";
import { useAIModule } from "@/models/modules";
import { useAIChatContext } from "@/hooks/useAIChatContext";
import { useAuth } from "@/hooks/useAuth";
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
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { integrationsMeta, defaultMagnetTools, defaultAdminMagnetTools, type AIIntegrationType } from "@/types/modules";
import type { ChatMode } from "@/components/chat/types";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { config: aiConfig } = useAIModule();
  const { user } = useAuth();
  const isAdmin = !!user;
  const chatMode: ChatMode = isAdmin ? 'admin' : 'public';
  const { contextData, contextSummary, hasContext, isLoading: contextLoading } = useAIChatContext();
  const [showNewChatDialog, setShowNewChatDialog] = React.useState(false);
  const [resetTrigger, setResetTrigger] = React.useState(0);
  
  // Track if we should wait for context before auto-sending
  const hasInitialMessages = Boolean(location.state?.messages?.length);
  const [contextReady, setContextReady] = React.useState(!hasInitialMessages);
  
  // Mark context as ready once it's loaded (only matters for initial navigation with messages)
  React.useEffect(() => {
    if (hasInitialMessages && !contextLoading && !contextReady) {
      setContextReady(true);
    }
  }, [hasInitialMessages, contextLoading, contextReady]);
  
  // Get configured integration from module, allow user override
  const configuredIntegration = aiConfig?.active_integration || 'openai';
  const [selectedIntegration, setSelectedIntegration] = React.useState<AIIntegrationType>(configuredIntegration);

  // Get initial messages, sessionId and placeholder from navigation state if available
  // Only pass them once context is ready
  const initialMessages = contextReady ? (location.state?.messages as Message[] | undefined) : undefined;
  const initialSessionId = location.state?.sessionId as string | undefined;
  const passedPlaceholder = location.state?.placeholder as string | undefined;
  
  // Get available AI integrations
  const availableIntegrations = integrationsMeta.filter(
    (meta) => meta.category === 'ai' && meta.available
  );
  
  const selectedMeta = availableIntegrations.find(m => m.type === selectedIntegration);
  
  // Get webhook URL for n8n, otherwise use edge function
  const webhookUrl = selectedIntegration === 'n8n' 
    ? (aiConfig?.webhook_url || "https://agent.froste.eu/webhook/magnet")
    : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

  const handleBack = () => {
    navigate("/");
  };

  const handleNewChat = () => {
    setShowNewChatDialog(true);
  };

  const confirmNewChat = () => {
    setResetTrigger((prev) => prev + 1);
    setShowNewChatDialog(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2 hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>

          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold bg-gradient-to-r from-apple-purple to-apple-blue bg-clip-text text-transparent">
              {isAdmin ? 'Magnet CMS' : 'Chat with Magnet'}
            </h1>
            
            {isAdmin && (
              <Badge variant="outline" className="text-xs gap-1 border-primary/30">
                <Shield className="h-3 w-3" />
                Admin
              </Badge>
            )}
            
            {/* Integration Selector Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 h-7 text-xs">
                  {selectedMeta?.name || 'Select AI'}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="bg-background border-border">
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
            
            {hasContext && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Database className="h-3 w-3" />
                {contextSummary}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleNewChat} className="flex items-center gap-2">
              <MessageSquarePlus className="h-4 w-4" />
              <span>New Chat</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Chat Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Show loading while waiting for context on initial navigation */}
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
            integration={selectedIntegration}
            integrationConfig={aiConfig?.integration}
            systemPrompt={aiConfig?.system_prompt || ''}
            enabledTools={(aiConfig?.magnet_tools || defaultMagnetTools).filter(t => t.enabled).map(t => t.id)}
          />
        )}
      </main>

      {/* New Chat Confirmation Dialog */}
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
            <AlertDialogAction onClick={confirmNewChat}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Chat;
