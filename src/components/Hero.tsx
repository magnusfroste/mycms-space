import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import AppleChat, { Message } from "./AppleChat";
import { useNavigate } from "react-router-dom";
import { useHeroWithFallback } from "@/hooks/useHeroWithFallback";
import { iconMap } from "@/lib/constants/iconMaps";

const Hero = () => {
  const { hero: heroData, isLoading } = useHeroWithFallback();
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
    <>
      <section
        className="min-h-screen flex flex-col justify-center py-20 relative overflow-hidden"
        aria-labelledby="hero-heading"
      >
        {/* Background gradient circles */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/20 rounded-full filter blur-3xl opacity-30"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-apple-blue/20 rounded-full filter blur-3xl opacity-30"></div>

        <div className="container mx-auto px-4 z-10">
          <div className="max-w-4xl mx-auto text-center">
            {isLoading ? (
              // Loading state
              <>
                <Skeleton className="h-16 w-3/4 mx-auto mb-6" />
                <Skeleton className="h-6 w-2/3 mx-auto mb-10" />
                <div className="flex justify-center gap-8 mb-16">
                  <div className="flex flex-col items-center">
                    <Skeleton className="h-12 w-12 rounded-full mb-2" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex flex-col items-center">
                    <Skeleton className="h-12 w-12 rounded-full mb-2" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex flex-col items-center">
                    <Skeleton className="h-12 w-12 rounded-full mb-2" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </>
            ) : (
              <>
                <h1
                  id="hero-heading"
                  className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-apple-purple to-apple-blue bg-clip-text text-transparent mb-6 animate-fade-in-slow"
                >
                  {heroData?.name || "Magnus Froste"}
                </h1>

                <p className="text-xl md:text-2xl text-muted-foreground mb-10 animate-fade-in">
                  {heroData?.tagline || "Innovation Strategist & AI Integration Expert"}
                </p>

                <div className="flex justify-center gap-8 mb-12 animate-fade-in">
                  <div className="flex flex-col items-center" aria-label={heroData?.feature1 || "Feature 1"}>
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                      {iconMap[heroData?.feature1Icon || "Rocket"]}
                    </div>
                    <span className="text-foreground/80">{heroData?.feature1 || "Innovation"}</span>
                  </div>

                  <div className="flex flex-col items-center" aria-label={heroData?.feature2 || "Feature 2"}>
                    <div className="w-12 h-12 rounded-full bg-apple-blue/20 flex items-center justify-center mb-2">
                      {iconMap[heroData?.feature2Icon || "BarChart"]}
                    </div>
                    <span className="text-foreground/80">{heroData?.feature2 || "Strategy"}</span>
                  </div>

                  <div className="flex flex-col items-center" aria-label={heroData?.feature3 || "Feature 3"}>
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                      {iconMap[heroData?.feature3Icon || "Brain"]}
                    </div>
                    <span className="text-foreground/80">{heroData?.feature3 || "AI Integration"}</span>
                  </div>
                </div>
              </>
            )}

            {/* Chat Section - moved up and integrated */}
            <div className="mt-8 mb-8">
              <AppleChat
                webhookUrl="https://agent.froste.eu/webhook/magnet"
                onMessagesChange={setCurrentMessages}
                onSessionIdChange={setCurrentSessionId}
                skipWebhook={true}
                showQuickActions={true}
              />
            </div>

            <a
              href="#about"
              className="inline-flex items-center justify-center animate-bounce"
              aria-label="Scroll to About section"
            >
              <ChevronDown className="h-8 w-8 text-muted-foreground" />
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
