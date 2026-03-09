// ============================================
// TypewriterText — Character-by-character text reveal
// Optional keystroke sound via Web Audio API
// ============================================

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface TypewriterTextProps {
  text: string;
  speed?: number;         // ms per character (default 40)
  delay?: number;         // ms before typing starts (default 0)
  enableSound?: boolean;  // allow sound (user can still mute)
  onComplete?: () => void;
  className?: string;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 40,
  delay = 0,
  enableSound = false,
  onComplete,
  className = '',
}) => {
  const [displayedCount, setDisplayedCount] = useState(0);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(!enableSound);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const completedRef = useRef(false);

  // Stable text reference
  const textRef = useRef(text);
  textRef.current = text;

  // Initialize AudioContext lazily
  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  // Synthesized keystroke tick — tiny sine blip
  const playTick = useCallback(() => {
    if (muted) return;
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 600 + Math.random() * 400;
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.02);
    } catch {
      // Audio not supported — silent fail
    }
  }, [muted, getAudioCtx]);

  // Start after delay
  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  // Typing animation via requestAnimationFrame
  useEffect(() => {
    if (!started) return;

    completedRef.current = false;
    startTimeRef.current = performance.now();
    setDisplayedCount(0);

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const count = Math.min(Math.floor(elapsed / speed) + 1, textRef.current.length);
      
      setDisplayedCount((prev) => {
        if (count > prev) {
          playTick();
        }
        return count;
      });

      if (count < textRef.current.length) {
        rafRef.current = requestAnimationFrame(tick);
      } else if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [started, speed, playTick, onComplete]);

  // Cleanup audio context
  useEffect(() => {
    return () => {
      audioCtxRef.current?.close();
    };
  }, []);

  const displayedText = text.slice(0, displayedCount);
  const isTyping = started && displayedCount < text.length;
  const isDone = displayedCount >= text.length;

  return (
    <span className={`relative inline ${className}`}>
      {displayedText}
      {/* Blinking cursor */}
      <span
        className={`inline-block w-[2px] h-[1em] bg-primary ml-0.5 align-text-bottom ${
          isDone ? 'animate-pulse' : ''
        } ${!started ? 'opacity-0' : 'opacity-100'}`}
        aria-hidden="true"
      />
      {/* Sound toggle */}
      {enableSound && started && (
        <button
          onClick={() => setMuted((m) => !m)}
          className="absolute -right-8 top-1/2 -translate-y-1/2 p-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      )}
    </span>
  );
};

export default TypewriterText;
