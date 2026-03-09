// ============================================
// Chat Input Component
// Text input with send button and file upload
// ============================================

import React, { useRef, useEffect, useState } from "react";
import { ArrowUp, Paperclip, X, FileText, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useVoiceRecorder } from "@/hooks/useVoice";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (attachedFileContent?: string, attachedFileName?: string) => void;
  placeholder: string;
  isLoading: boolean;
  fullPage: boolean;
  voiceEnabled?: boolean;
}

const ACCEPTED_TYPES = [".md", ".txt", ".pdf"];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

async function extractPdfText(file: File): Promise<string> {
  const { supabase } = await import("@/integrations/supabase/client");
  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
  );

  const { data, error } = await supabase.functions.invoke("parse-document", {
    body: { content: base64, filename: file.name },
  });

  if (error) throw new Error(error.message || "Failed to parse PDF");
  return (data?.text as string) || "Could not extract text from PDF.";
}

/** Upload file to agent-documents bucket and save reference in agent_memory */
async function persistFile(file: File, textContent: string): Promise<void> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `uploads/${timestamp}-${safeName}`;

    // Upload original file to storage
    const { error: uploadError } = await supabase.storage
      .from("agent-documents")
      .upload(storagePath, file, { contentType: file.type || "application/octet-stream" });

    if (uploadError) {
      console.warn("[ChatInput] Storage upload failed:", uploadError.message);
      return; // Non-blocking — chat still works
    }

    // Save reference + extracted text in agent_memory
    const { error: memoryError } = await supabase.from("agent_memory").insert({
      category: "document",
      key: `upload:${safeName}`,
      content: textContent.slice(0, 50000), // Cap at 50k chars
      metadata: {
        filename: file.name,
        storage_path: storagePath,
        bucket: "agent-documents",
        size_bytes: file.size,
        mime_type: file.type,
        uploaded_at: new Date().toISOString(),
      },
    });

    if (memoryError) {
      console.warn("[ChatInput] agent_memory insert failed:", memoryError.message);
    } else {
      console.log("[ChatInput] File persisted:", storagePath);
    }
  } catch (err) {
    console.warn("[ChatInput] persistFile error:", err);
  }
}

const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  placeholder,
  isLoading,
  fullPage,
  voiceEnabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  const handleTranscript = React.useCallback((text: string) => {
    onChange(value ? value + ' ' + text : text);
  }, [onChange, value]);
  
  const { isRecording, toggleRecording } = useVoiceRecorder(handleTranscript);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    if (value === "" && textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    onSend(attachedFile?.content, attachedFile?.name);
    setAttachedFile(null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be re-selected
    e.target.value = "";

    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "File too large", description: "Max 2 MB", variant: "destructive" });
      return;
    }

    setIsReadingFile(true);
    try {
      let text: string;
      if (file.name.endsWith(".pdf")) {
        text = await extractPdfText(file);
      } else {
        text = await readFileAsText(file);
      }
      setAttachedFile({ name: file.name, content: text });
      // Persist to storage + agent_memory in background
      persistFile(file, text);
    } catch (err) {
      toast({
        title: "Could not read file",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsReadingFile(false);
    }
  };

  return (
    <div className={fullPage ? "shrink-0 border-t border-border/50 bg-background/80 backdrop-blur-sm p-3 sm:p-4" : "mt-4"}>
      <div className="relative max-w-3xl mx-auto">
        <div className="relative bg-muted/30 border border-border/60 rounded-2xl transition-colors focus-within:border-border focus-within:bg-muted/40">
          {/* Attached file pill — inside the input area */}
          {attachedFile && (
            <div className="px-3 pt-3 pb-0">
              <div className="inline-flex items-center gap-2 text-xs bg-background/80 border border-border/50 rounded-lg px-2.5 py-1.5 text-muted-foreground">
                <FileText className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                <span className="truncate max-w-[180px] font-medium">{attachedFile.name}</span>
                <button
                  onClick={() => setAttachedFile(null)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="Remove file"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="w-full px-4 resize-none text-sm min-h-[44px] max-h-[200px] overflow-y-auto bg-transparent py-3 text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            rows={1}
            disabled={isLoading || isReadingFile}
            autoFocus
          />

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-2 pb-2">
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isReadingFile}
                className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/60 transition-colors disabled:opacity-30"
                aria-label="Attach file"
                type="button"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              {voiceEnabled && (
                <button
                  onClick={toggleRecording}
                  disabled={isLoading}
                  className={`relative p-1.5 rounded-lg transition-colors disabled:opacity-30 ${
                    isRecording
                      ? "text-destructive"
                      : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/60"
                  }`}
                  aria-label={isRecording ? "Stop recording" : "Voice input"}
                  type="button"
                >
                  {isRecording && (
                    <>
                      <span className="absolute inset-0 rounded-lg bg-destructive/10 animate-pulse" />
                      <span className="absolute -inset-1 rounded-xl border border-destructive/30 animate-[ping_1.5s_ease-in-out_infinite] opacity-40" />
                    </>
                  )}
                  <span className="relative">
                    {isRecording ? <Square className="h-3.5 w-3.5 fill-current" /> : <Mic className="h-4 w-4" />}
                  </span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              onChange={handleFileSelect}
              className="hidden"
            />

            <Button
              onClick={handleSend}
              disabled={(!value.trim() && !attachedFile) || isLoading || isReadingFile}
              size="icon"
              className="h-7 w-7 rounded-lg"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
