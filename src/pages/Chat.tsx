import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppleChat from "@/components/AppleChat";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useChatSettings } from "@/hooks/useChatSettings";
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

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: settings } = useChatSettings();
  const [showNewChatDialog, setShowNewChatDialog] = React.useState(false);
  const [resetTrigger, setResetTrigger] = React.useState(0);

  // Get initial messages and sessionId from navigation state if available
  const initialMessages = location.state?.messages as Message[] | undefined;
  const initialSessionId = location.state?.sessionId as string | undefined;
  
  const webhookUrl = settings?.webhook_url || "https://agent.froste.eu/webhook/magnet";

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
        <AppleChat
          webhookUrl={webhookUrl}
          fullPage={true}
          initialMessages={initialMessages}
          initialSessionId={initialSessionId}
          resetTrigger={resetTrigger}
          showQuickActions={true}
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
