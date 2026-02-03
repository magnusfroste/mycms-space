// ============================================
// Hero Block - 2026 Design System
// Immersive hero with parallax mesh gradient
// ============================================

import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { iconMap } from '@/lib/constants/iconMaps';
import FallingStars from '@/components/animations/FallingStars';
import ParticleField from '@/components/animations/ParticleField';
import GradientShift from '@/components/animations/GradientShift';
import type { HeroBlockConfig } from '@/types/blockConfigs';

interface HeroBlockProps {
  config: Record<string, unknown>;
}

const HeroBlock: React.FC<HeroBlockProps> = ({ config }) => {
  const typedConfig = config as HeroBlockConfig;
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  
  const name = typedConfig.name || 'Your Name';
  const tagline = typedConfig.tagline || 'Your Tagline';
  const features = typedConfig.features || [];
  const enableAnimations = typedConfig.enable_animations ?? true;
  const animationStyle = typedConfig.animation_style || 'falling-stars';

  const isLoading = !typedConfig.name;

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
          <div className="max-w-5xl mx-auto text-center">
            {isLoading ? (
              <div className="space-y-6">
                <Skeleton className="h-20 w-3/4 mx-auto rounded-2xl" />
                <Skeleton className="h-8 w-2/3 mx-auto rounded-xl" />
                <div className="flex justify-center gap-8 pt-8">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-3">
                      <Skeleton className="h-16 w-16 rounded-2xl" />
                      <Skeleton className="h-4 w-24 rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Eyebrow text */}
                <div 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/20 mb-8 animate-fade-in"
                  style={{ animationDelay: '0s' }}
                >
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-medium text-primary">Welcome</span>
                </div>

                {/* Main Heading */}
                <h1
                  className="text-display-sm md:text-display lg:text-display-lg font-bold mb-6 animate-fade-in"
                  style={{ animationDelay: '0.1s' }}
                >
                  <span className="bg-gradient-primary bg-clip-text text-transparent drop-shadow-sm">
                    {name}
                  </span>
                </h1>

                {/* Tagline */}
                <p 
                  className="text-xl md:text-2xl lg:text-3xl text-muted-foreground font-light mb-14 max-w-3xl mx-auto animate-fade-in leading-relaxed"
                  style={{ animationDelay: '0.2s' }}
                >
                  {tagline}
                </p>

                {/* Features */}
                {features.length > 0 && (
                  <div 
                    className="flex flex-wrap justify-center gap-4 md:gap-6 animate-fade-in"
                    style={{ animationDelay: '0.3s' }}
                  >
                    {features.map((feature, index) => (
                      <div
                        key={index}
                        className="group relative"
                      >
                        <div className="glass-card p-5 flex flex-col items-center gap-3 min-w-[120px] backdrop-blur-xl">
                          {/* Icon Container */}
                          <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                              <div className="text-primary">
                                {iconMap[feature.icon] || iconMap['Rocket']}
                              </div>
                            </div>
                            {/* Glow effect on hover */}
                            <div className="absolute inset-0 rounded-2xl bg-primary/25 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                          </div>
                          
                          {/* Label */}
                          <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                            {feature.text}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Scroll Indicator - links to chat */}
                <div 
                  className="mt-16 animate-fade-in"
                  style={{ animationDelay: '0.5s' }}
                >
                  <a 
                    href="#chat"
                    className="inline-flex flex-col items-center gap-2 text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
                  >
                    <div className="w-5 h-8 rounded-full border border-current flex justify-center pt-1.5">
                      <div className="w-0.5 h-1.5 rounded-full bg-current animate-bounce" />
                    </div>
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBlock;
