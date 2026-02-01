import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, MessageSquarePlus, Database, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatInterface from "@/components/ChatInterface";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAIModule } from "@/models/modules";
import { useAIChatContext } from "@/hooks/useAIChatContext";
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
import { integrationsMeta, type AIIntegrationType } from "@/types/modules";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { config: aiConfig } = useAIModule();
  const { contextData, contextSummary, hasContext } = useAIChatContext();
  const [showNewChatDialog, setShowNewChatDialog] = React.useState(false);
  const [resetTrigger, setResetTrigger] = React.useState(0);
  
  // Get configured integration from module, allow user override
  const configuredIntegration = aiConfig?.active_integration || 'n8n';
  const [selectedIntegration, setSelectedIntegration] = React.useState<AIIntegrationType>(configuredIntegration);

  // Get initial messages and sessionId from navigation state if available
  const initialMessages = location.state?.messages as Message[] | undefined;
  const initialSessionId = location.state?.sessionId as string | undefined;
  
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
              Chat with Magnet
            </h1>
            
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
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Chat Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <ChatInterface
          webhookUrl={webhookUrl}
          fullPage={true}
          initialMessages={initialMessages}
          initialSessionId={initialSessionId}
          resetTrigger={resetTrigger}
          showQuickActions={true}
          siteContext={contextData}
          integration={selectedIntegration}
          integrationConfig={aiConfig?.integration}
        />
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
