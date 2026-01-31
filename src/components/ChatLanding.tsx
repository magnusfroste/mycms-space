import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import AppleChat, { Message } from "./AppleChat";
import { useAIModule } from "@/models/modules";

interface ChatLandingProps {
  title?: string;
  subtitle?: string;
}

const ChatLanding: React.FC<ChatLandingProps> = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const { config } = useAIModule();
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

  const webhookUrl = config?.webhook_url || "https://agent.froste.eu/webhook/magnet";

  return (
    <div className="pb-20" aria-label="Chat with Magnus">
      <div className="container mx-auto px-4">
        {(title || subtitle) && (
          <div className="text-center mb-8">
            {title && <h2 className="section-title">{title}</h2>}
            {subtitle && (
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}
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
    </div>
  );
};

export default ChatLanding;