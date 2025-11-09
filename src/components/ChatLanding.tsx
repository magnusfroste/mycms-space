import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppleChat, { Message } from "./AppleChat";

const ChatLanding = () => {
  const navigate = useNavigate();
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

  return (
    <section className="py-12" aria-label="Chat with Magnus">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <AppleChat
            webhookUrl="https://agent.froste.eu/webhook/magnet"
            onMessagesChange={setCurrentMessages}
            onSessionIdChange={setCurrentSessionId}
            skipWebhook={true}
            showQuickActions={true}
          />
        </div>
      </div>
    </section>
  );
};

export default ChatLanding;
