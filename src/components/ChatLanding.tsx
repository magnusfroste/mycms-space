import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import AppleChat, { Message } from "./AppleChat";
import { useChatSettings } from "@/hooks/useChatSettings";

const ChatLanding = () => {
  const navigate = useNavigate();
  const { data: settings } = useChatSettings();
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);
  const didNavigateRef = React.useRef(false);

  // Navigate to full chat after first user message
  useEffect(() => {
    const hasUserMsg = currentMessages.some((m) => m.isUser);
    if (hasUserMsg && !didNavigateRef.current && currentSessionId) {
      didNavigateRef.current = true;
      navigate("/chat", {
        state: {
          fromHero: true,
          messages: currentMessages,
          sessionId: currentSessionId,
        },
      });
    }
  }, [currentMessages, currentSessionId, navigate]);

  const webhookUrl = settings?.webhook_url || "https://agent.froste.eu/webhook/magnet";

  return (
    <section className="pb-12" aria-label="Chat with Magnus">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <AppleChat
            webhookUrl={webhookUrl}
            onMessagesChange={setCurrentMessages}
            onSessionIdChange={setCurrentSessionId}
            skipWebhook={true}
            showQuickActions={true}
          />
          
          <div className="flex justify-center mt-12">
            <a
              href="#about"
              className="inline-flex items-center justify-center animate-bounce"
              aria-label="Scroll to About section"
            >
              <ChevronDown className="h-8 w-8 text-muted-foreground" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChatLanding;
