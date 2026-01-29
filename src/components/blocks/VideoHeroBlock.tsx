// ============================================
// Video Hero Block
// Full-screen video background with overlay content
// ============================================

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoHeroBlockConfig {
  video_url?: string;
  poster_url?: string;
  headline?: string;
  subheadline?: string;
  cta_text?: string;
  cta_url?: string;
  overlay_opacity?: number;
  text_alignment?: 'left' | 'center' | 'right';
  show_controls?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
}

interface VideoHeroBlockProps {
  config: Record<string, unknown>;
}

const VideoHeroBlock: React.FC<VideoHeroBlockProps> = ({ config }) => {
  const settings = config as VideoHeroBlockConfig;
  const [isPlaying, setIsPlaying] = useState(settings.autoplay !== false);
  const [isMuted, setIsMuted] = useState(settings.muted !== false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const alignmentClasses = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  };

  return (
    <section className="relative h-screen min-h-[600px] overflow-hidden">
      {/* Video Background */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src={settings.video_url || 'https://assets.mixkit.co/videos/preview/mixkit-abstract-technology-network-connections-27611-large.mp4'}
        poster={settings.poster_url}
        autoPlay={settings.autoplay !== false}
        loop={settings.loop !== false}
        muted={settings.muted !== false}
        playsInline
      />

      {/* Gradient Overlay */}
      <div 
        className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"
        style={{ opacity: settings.overlay_opacity ?? 0.7 }}
      />

      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'grid-move 20s linear infinite',
          }}
        />
      </div>

      {/* Content */}
      <div className={cn(
        'relative z-10 h-full flex flex-col justify-center px-6 md:px-12 lg:px-24',
        alignmentClasses[settings.text_alignment || 'center']
      )}>
        <div className="max-w-4xl space-y-6">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_auto]">
              {settings.headline || 'Create Something Extraordinary'}
            </span>
          </h1>
          
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl">
            {settings.subheadline || 'Transform your vision into reality with cutting-edge design and technology.'}
          </p>

          {settings.cta_text && (
            <div className="pt-4">
              <Button 
                size="lg" 
                className="group relative overflow-hidden"
                onClick={() => settings.cta_url && window.open(settings.cta_url, '_blank')}
              >
                <span className="relative z-10">{settings.cta_text}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Video Controls */}
      {settings.show_controls !== false && (
        <div className="absolute bottom-8 right-8 z-20 flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="bg-background/20 backdrop-blur-md border-white/20 hover:bg-background/40"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="bg-background/20 backdrop-blur-md border-white/20 hover:bg-background/40"
            onClick={toggleMute}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1.5 h-3 bg-white/60 rounded-full mt-2 animate-bounce" />
        </div>
      </div>

      <style>{`
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-shift {
          animation: gradient-shift 3s ease infinite;
        }
      `}</style>
    </section>
  );
};

export default VideoHeroBlock;
