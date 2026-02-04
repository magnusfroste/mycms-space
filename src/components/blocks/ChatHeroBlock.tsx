// ============================================
// Chat Hero Block - Conversational Hero
// Immersive hero with AI chat as focal point
// ============================================

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { iconMap } from '@/lib/constants/iconMaps';
import { useAIModule } from '@/models/modules';
import FallingStars from '@/components/animations/FallingStars';
import ParticleField from '@/components/animations/ParticleField';
import GradientShift from '@/components/animations/GradientShift';
import ChatInput from '@/components/chat/ChatInput';
import ChatQuickActions from '@/components/chat/ChatQuickActions';
import type { ChatHeroBlockConfig } from '@/types/blockConfigs';
import type { QuickActionConfig, Message } from '@/components/chat/types';

interface ChatHeroBlockProps {
  config: Record<string, unknown>;
}

const ChatHeroBlock: React.FC<ChatHeroBlockProps> = ({ config }) => {
  const navigate = useNavigate();
  const { config: aiConfig } = useAIModule();
  const typedConfig = config as ChatHeroBlockConfig;
  
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Config with defaults
  const agentName = typedConfig.agent_name || 'AI Assistant';
  const agentTagline = typedConfig.agent_tagline || 'How can I help you today?';
  const welcomeBadge = typedConfig.welcome_badge || 'Welcome';
  const enableAnimations = typedConfig.enable_animations ?? true;
  const animationStyle = typedConfig.animation_style || 'falling-stars';
  const placeholder = typedConfig.placeholder || 'Ask me anything...';
  const showQuickActions = typedConfig.show_quick_actions ?? true;
  
  // Parse quick actions from config
  const quickActions: QuickActionConfig[] = (typedConfig.quick_actions || [])
    .filter((a: QuickActionConfig) => a.enabled !== false)
    .sort((a: QuickActionConfig, b: QuickActionConfig) => (a.order_index || 0) - (b.order_index || 0));

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mouse tracking for interactive gradient
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const parallaxOffset = scrollY * 0.3;

  // Handle send - navigate to /chat with the message
  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: inputValue.trim(),
      isUser: true,
    };

    // Navigate to full chat page with the initial message and placeholder
    navigate('/chat', {
      state: {
        fromHero: true,
        messages: [userMessage],
        sessionId: crypto.randomUUID(),
        placeholder: placeholder,
      },
    });
  };

  // Handle quick action selection
  const handleQuickAction = (message: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: message,
      isUser: true,
    };

    navigate('/chat', {
      state: {
        fromHero: true,
        messages: [userMessage],
        sessionId: crypto.randomUUID(),
        placeholder: placeholder,
      },
    });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Animated Mesh Gradient Background */}
      <div 
        className="absolute inset-0 transition-transform duration-1000 ease-out"
        style={{ transform: `translateY(${parallaxOffset * 0.5}px)` }}
      >
        {/* Primary gradient orb */}
        <div 
          className="absolute w-[800px] h-[800px] rounded-full blur-[120px] opacity-30 dark:opacity-40 transition-all duration-700"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
            left: `${20 + mousePos.x * 10}%`,
            top: `${-20 + mousePos.y * 10}%`,
          }}
        />
        
        {/* Secondary gradient orb */}
        <div 
          className="absolute w-[600px] h-[600px] rounded-full blur-[100px] opacity-25 dark:opacity-35 transition-all duration-700"
          style={{
            background: 'radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)',
            right: `${10 + (1 - mousePos.x) * 15}%`,
            bottom: `${-10 + (1 - mousePos.y) * 15}%`,
          }}
        />
        
        {/* Tertiary gradient orb */}
        <div 
          className="absolute w-[500px] h-[500px] rounded-full blur-[80px] opacity-20 dark:opacity-30 transition-all duration-700"
          style={{
            background: 'radial-gradient(circle, hsl(var(--gradient-mid)) 0%, transparent 70%)',
            left: `${50 + mousePos.x * 5}%`,
            top: `${40 + mousePos.y * 10}%`,
          }}
        />
      </div>

      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Animated Background Elements */}
      {enableAnimations && (
        <div className="absolute inset-0 pointer-events-none">
          {animationStyle === 'falling-stars' && <FallingStars />}
          {animationStyle === 'particles' && <ParticleField />}
          {animationStyle === 'gradient-shift' && <GradientShift />}
        </div>
      )}

      {/* Floating Orbs with parallax */}
      <div 
        className="absolute top-1/4 -left-32 w-96 h-96 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl animate-float"
        style={{ transform: `translateY(${parallaxOffset * 0.2}px)` }}
      />
      <div 
        className="absolute bottom-1/4 -right-32 w-80 h-80 bg-gradient-to-br from-accent/15 to-transparent rounded-full blur-3xl animate-float"
        style={{ 
          animationDelay: '-3s',
          transform: `translateY(${parallaxOffset * 0.15}px)` 
        }}
      />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          transform: `translateY(${parallaxOffset * 0.1}px)`,
        }}
      />

      {/* Radial vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background)/0.4)_100%)]" />

      {/* Content with parallax */}
      <div 
        className="relative z-10 w-full"
        style={{ transform: `translateY(${parallaxOffset * -0.1}px)` }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            {/* Welcome Badge */}
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/20 mb-8 animate-fade-in"
              style={{ animationDelay: '0s' }}
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">{welcomeBadge}</span>
            </div>

            {/* Agent Name */}
            <h1
              className="text-display-sm md:text-display lg:text-display-lg font-bold mb-4 animate-fade-in"
              style={{ animationDelay: '0.1s' }}
            >
              <span className="bg-gradient-primary bg-clip-text text-transparent drop-shadow-sm">
                {agentName}
              </span>
            </h1>

            {/* Agent Tagline */}
            <p 
              className="text-xl md:text-2xl text-muted-foreground font-light mb-12 animate-fade-in"
              style={{ animationDelay: '0.2s' }}
            >
              {agentTagline}
            </p>

            {/* Chat Input */}
            <div 
              className="animate-fade-in"
              style={{ animationDelay: '0.3s' }}
            >
              <div className="glass-card shadow-apple p-2">
                <div className="relative">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={placeholder}
                    className="w-full bg-background border border-border/50 rounded-2xl px-6 py-4 pr-14 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none text-base text-foreground placeholder:text-muted-foreground shadow-sm min-h-[56px] max-h-[120px] overflow-y-auto"
                    rows={1}
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading}
                    className="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            {showQuickActions && quickActions.length > 0 && (
              <div 
                className="mt-6 animate-fade-in"
                style={{ animationDelay: '0.4s' }}
              >
                <div className="flex flex-wrap justify-center gap-2">
                  {quickActions.map((action) => {
                    const IconComponent = iconMap[action.icon];
                    return (
                      <button
                        key={action.id || action.label}
                        onClick={() => handleQuickAction(action.message)}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-normal rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      >
                        {IconComponent && <span className="w-4 h-4">{IconComponent}</span>}
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChatHeroBlock;
