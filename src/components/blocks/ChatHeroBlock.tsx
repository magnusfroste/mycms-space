// ============================================
// Chat Hero Block - Conversational Hero
// Immersive hero with typewriter greeting + AI chat
// ============================================

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { iconMap } from '@/lib/constants/iconMaps';
import FallingStars from '@/components/animations/FallingStars';
import ParticleField from '@/components/animations/ParticleField';
import GradientShift from '@/components/animations/GradientShift';
import TypewriterText from '@/components/animations/TypewriterText';
import ChatInput from '@/components/chat/ChatInput';
import type { ChatHeroBlockConfig } from '@/types/blockConfigs';
import type { QuickActionConfig, Message } from '@/components/chat/types';

interface ChatHeroBlockProps {
  config: Record<string, unknown>;
}

const ChatHeroBlock: React.FC<ChatHeroBlockProps> = ({ config }) => {
  const navigate = useNavigate();
  const typedConfig = config as ChatHeroBlockConfig;

  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [typingDone, setTypingDone] = useState(false);

  // Config with defaults
  const agentName = typedConfig.agent_name || 'AI Assistant';
  const welcomeBadge = typedConfig.welcome_badge || 'Welcome';
  const enableAnimations = typedConfig.enable_animations ?? true;
  const animationStyle = typedConfig.animation_style || 'falling-stars';
  const placeholder = typedConfig.placeholder || 'Ask me anything...';
  const showQuickActions = typedConfig.show_quick_actions ?? true;
  const greetingMessages = typedConfig.greeting_messages || [];
  const typewriterSpeed = typedConfig.typewriter_speed || 40;
  const enableSound = typedConfig.enable_sound ?? false;

  // Use first greeting message, fallback to agent_tagline
  const greetingText = greetingMessages.length > 0
    ? greetingMessages[0]
    : (typedConfig.agent_tagline || 'How can I help you today?');

  // Quick actions
  const quickActions: QuickActionConfig[] = (typedConfig.quick_actions || [])
    .filter((a: QuickActionConfig) => a.enabled !== false)
    .sort((a: QuickActionConfig, b: QuickActionConfig) => (a.order_index || 0) - (b.order_index || 0));

  // Parallax
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const parallaxOffset = scrollY * 0.3;

  const handleTypingComplete = useCallback(() => setTypingDone(true), []);

  // Navigate to /chat with message
  const handleSend = () => {
    if (!inputValue.trim()) return;
    const userMessage: Message = { id: crypto.randomUUID(), text: inputValue.trim(), isUser: true };
    navigate('/chat', { state: { fromHero: true, messages: [userMessage], sessionId: crypto.randomUUID(), placeholder } });
  };

  const handleQuickAction = (message: string) => {
    const userMessage: Message = { id: crypto.randomUUID(), text: message, isUser: true };
    navigate('/chat', { state: { fromHero: true, messages: [userMessage], sessionId: crypto.randomUUID(), placeholder } });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Animated Mesh Gradient Background */}
      <div
        className="hero-parallax-orb absolute inset-0 transition-transform duration-1000 ease-out"
        style={{ transform: `translateY(${parallaxOffset * 0.5}px)` }}
      >
        <div
          className="absolute w-[800px] h-[800px] rounded-full blur-[120px] opacity-30 dark:opacity-40 transition-all duration-700"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)', left: `${20 + mousePos.x * 10}%`, top: `${-20 + mousePos.y * 10}%` }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[100px] opacity-25 dark:opacity-35 transition-all duration-700"
          style={{ background: 'radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)', right: `${10 + (1 - mousePos.x) * 15}%`, bottom: `${-10 + (1 - mousePos.y) * 15}%` }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[80px] opacity-20 dark:opacity-30 transition-all duration-700"
          style={{ background: 'radial-gradient(circle, hsl(var(--gradient-mid)) 0%, transparent 70%)', left: `${50 + mousePos.x * 5}%`, top: `${40 + mousePos.y * 10}%` }}
        />
      </div>

      {/* Noise texture */}
      <div
        className="hero-parallax-orb absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
      />

      {/* Background Animations */}
      {enableAnimations && (
        <div className="hero-parallax-orb absolute inset-0 pointer-events-none">
          {animationStyle === 'falling-stars' && <FallingStars />}
          {animationStyle === 'particles' && <ParticleField />}
          {animationStyle === 'gradient-shift' && <GradientShift />}
        </div>
      )}

      {/* Floating orbs */}
      <div
        className="hero-parallax-orb absolute top-1/4 -left-32 w-96 h-96 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl animate-float"
        style={{ transform: `translateY(${parallaxOffset * 0.2}px)` }}
      />
      <div
        className="hero-parallax-orb absolute bottom-1/4 -right-32 w-80 h-80 bg-gradient-to-br from-accent/15 to-transparent rounded-full blur-3xl animate-float"
        style={{ animationDelay: '-3s', transform: `translateY(${parallaxOffset * 0.15}px)` }}
      />

      {/* Grid pattern */}
      <div
        className="hero-parallax-orb absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
        style={{ backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`, backgroundSize: '80px 80px', transform: `translateY(${parallaxOffset * 0.1}px)` }}
      />

      {/* Radial vignette */}
      <div className="hero-parallax-orb absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background)/0.4)_100%)]" />

      {/* Content */}
      <div className="relative z-10 w-full" style={{ transform: `translateY(${parallaxOffset * -0.1}px)` }}>
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
              <span className="gradient-text drop-shadow-sm">{agentName}</span>
            </h1>

            {/* Typing indicator + Typewriter greeting */}
            <div
              className="min-h-[3rem] mb-12 animate-fade-in"
              style={{ animationDelay: '0.3s' }}
            >
              {/* Typing indicator dots — shown briefly before text starts */}
              <div className="flex items-center justify-center gap-1 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0s' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0.15s' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>

              <p className="text-xl md:text-2xl text-muted-foreground font-light">
                <TypewriterText
                  text={greetingText}
                  speed={typewriterSpeed}
                  delay={800}
                  enableSound={enableSound}
                  onComplete={handleTypingComplete}
                />
              </p>
            </div>

            {/* Chat Input — fades in after typing completes */}
            <div
              className={`transition-all duration-500 ${typingDone ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              <ChatInput
                value={inputValue}
                onChange={setInputValue}
                onSend={handleSend}
                placeholder={placeholder}
                isLoading={isLoading}
                fullPage={false}
              />
            </div>

            {/* Quick Actions — fade in after input */}
            {showQuickActions && quickActions.length > 0 && (
              <div
                className={`mt-6 transition-all duration-500 delay-200 ${typingDone ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
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

            {/* Scroll indicator */}
            <div
              className={`mt-16 transition-all duration-500 delay-300 ${typingDone ? 'opacity-100' : 'opacity-0'}`}
            >
              <button
                onClick={() => window.scrollTo({ top: window.innerHeight * 0.85, behavior: 'smooth' })}
                className="inline-flex flex-col items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors group"
                aria-label="Scroll down"
              >
                <span className="text-xs tracking-widest uppercase">Explore</span>
                <div className="w-6 h-10 rounded-full border border-current flex items-start justify-center p-1.5">
                  <div className="w-1 h-2 rounded-full bg-current animate-bounce" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChatHeroBlock;
