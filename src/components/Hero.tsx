
import React, { useState } from 'react';
import { ChevronDown, Rocket, BarChart, Brain, Lightbulb, Building, LineChart, Layers, Users, Send } from 'lucide-react';
import { useHero } from '@/lib/airtable';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

// Map of icon names to components
const iconMap: Record<string, React.ReactNode> = {
  Rocket: <Rocket className="text-apple-purple h-5 w-5" />,
  BarChart: <BarChart className="text-apple-blue h-5 w-5" />,
  Brain: <Brain className="text-apple-purple h-5 w-5" />,
  Lightbulb: <Lightbulb className="text-apple-purple h-5 w-5" />,
  Building: <Building className="text-apple-blue h-5 w-5" />,
  LineChart: <LineChart className="text-apple-purple h-5 w-5" />,
  Layers: <Layers className="text-apple-blue h-5 w-5" />,
  Users: <Users className="text-apple-purple h-5 w-5" />
};

const Hero = () => {
  const { data: heroData, isLoading, error } = useHero();
  const [chatInput, setChatInput] = useState('');

  const handleChatSubmit = () => {
    if (chatInput.trim()) {
      // Try to find the n8n chat widget and open it
      const chatButton = document.querySelector('.n8n-chat-toggle') as HTMLElement;
      if (chatButton) {
        chatButton.click();
        // Wait for chat to open, then send message
        setTimeout(() => {
          const chatInputField = document.querySelector('.n8n-chat-input') as HTMLTextAreaElement;
          if (chatInputField) {
            chatInputField.value = chatInput;
            chatInputField.focus();
            // Trigger input and change events
            const inputEvent = new Event('input', { bubbles: true });
            const changeEvent = new Event('change', { bubbles: true });
            chatInputField.dispatchEvent(inputEvent);
            chatInputField.dispatchEvent(changeEvent);
            
            // Try to find and click the send button
            setTimeout(() => {
              const sendButton = document.querySelector('.n8n-chat-send-button') as HTMLElement;
              if (sendButton) {
                sendButton.click();
              }
            }, 200);
          }
        }, 800);
      } else {
        console.log('Chat widget not found, message would be:', chatInput);
      }
      setChatInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSubmit();
    }
  };

  return (
    <section className="min-h-screen flex flex-col justify-center py-20 relative overflow-hidden" aria-labelledby="hero-heading">
      {/* Background gradient circles */}
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-apple-light-purple rounded-full filter blur-3xl opacity-30"></div>
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-apple-light-blue rounded-full filter blur-3xl opacity-30"></div>
      
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
              <h1 id="hero-heading" className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-apple-purple to-apple-blue bg-clip-text text-transparent mb-6 animate-fade-in-slow">
                {heroData?.name || 'Magnus Froste'}
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-10 animate-fade-in">
                {heroData?.tagline || 'Innovation Strategist & AI Integration Expert'}
              </p>
              
              <div className="flex justify-center gap-8 mb-16 animate-fade-in">
                <div className="flex flex-col items-center" aria-label={heroData?.feature1 || 'Feature 1'}>
                  <div className="w-12 h-12 rounded-full bg-apple-light-purple flex items-center justify-center mb-2">
                    {iconMap[heroData?.feature1Icon || 'Rocket']}
                  </div>
                  <span className="text-gray-700">{heroData?.feature1 || 'Innovation'}</span>
                </div>
                
                <div className="flex flex-col items-center" aria-label={heroData?.feature2 || 'Feature 2'}>
                  <div className="w-12 h-12 rounded-full bg-apple-light-blue flex items-center justify-center mb-2">
                    {iconMap[heroData?.feature2Icon || 'BarChart']}
                  </div>
                  <span className="text-gray-700">{heroData?.feature2 || 'Strategy'}</span>
                </div>
                
                <div className="flex flex-col items-center" aria-label={heroData?.feature3 || 'Feature 3'}>
                  <div className="w-12 h-12 rounded-full bg-apple-light-purple flex items-center justify-center mb-2">
                    {iconMap[heroData?.feature3Icon || 'Brain']}
                  </div>
                  <span className="text-gray-700">{heroData?.feature3 || 'AI Integration'}</span>
                </div>
              </div>

              {/* Central Chat Interface */}
              <div className="max-w-2xl mx-auto mb-16 animate-fade-in">
                <div className="glass-card p-6">
                  <h3 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-apple-purple to-apple-blue bg-clip-text text-transparent">
                    Chat with Magnet - My Digital Twin
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Ask me anything about innovation, strategy, or AI integration. I'm here to help!
                  </p>
                  
                  <div className="relative">
                    <textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask Magnet about innovation, strategy, AI, or anything else..."
                      className="w-full bg-white bg-opacity-70 backdrop-blur-sm border border-gray-200 rounded-2xl px-6 py-4 pr-16 resize-none focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent transition-all min-h-[60px] max-h-[120px]"
                      rows={2}
                    />
                    <Button
                      onClick={handleChatSubmit}
                      disabled={!chatInput.trim()}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-apple-purple hover:bg-apple-purple/90 text-white rounded-xl px-4 py-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {[
                      "Tell me about your innovation approach",
                      "How can AI transform my business?",
                      "What's your strategy methodology?",
                      "Share insights on digital transformation"
                    ].map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setChatInput(suggestion)}
                        className="px-4 py-2 bg-apple-light-purple text-apple-purple rounded-full text-sm hover:bg-apple-purple hover:text-white transition-all"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
          
          <a 
            href="#about"
            className="inline-flex items-center justify-center animate-bounce"
            aria-label="Scroll to About section"
          >
            <ChevronDown className="h-8 w-8 text-gray-400" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
