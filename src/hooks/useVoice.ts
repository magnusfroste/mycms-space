// ============================================
// useVoice Hook
// Handles STT (Whisper) and TTS (OpenAI) 
// ============================================

import { useState, useRef, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

export function useVoiceRecorder(onTranscript: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size < 100) return;

        try {
          const formData = new FormData();
          formData.append("audio", blob, "recording.webm");

          const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whisper-transcribe`;
          const res = await fetch(url, {
            method: "POST",
            headers: {
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: formData,
          });

          if (!res.ok) throw new Error(`Transcription failed: ${res.status}`);
          const data = await res.json();
          if (data.text?.trim()) {
            onTranscript(data.text.trim());
          }
        } catch (err) {
          console.error("[Voice] Transcription error:", err);
          toast({
            title: "Transcription failed",
            description: err instanceof Error ? err.message : "Unknown error",
            variant: "destructive",
          });
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("[Voice] Mic error:", err);
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to use voice input.",
        variant: "destructive",
      });
    }
  }, [onTranscript]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return { isRecording, toggleRecording };
}

export function useTTS() {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string, messageId: string, voice?: string) => {
    // If already playing this message, stop
    if (isPlaying === messageId && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(null);
      return;
    }

    // Stop any existing playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsPlaying(messageId);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text, voice }),
      });

      if (!res.ok) throw new Error(`TTS failed: ${res.status}`);

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        setIsPlaying(null);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      audioRef.current = audio;
      await audio.play();
    } catch (err) {
      console.error("[TTS] Error:", err);
      setIsPlaying(null);
      toast({
        title: "Playback failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [isPlaying]);

  return { isPlaying, speak };
}
