// ============================================
// Chat Input Component
// Text input with send button and file upload
// ============================================

import React, { useRef, useEffect, useState } from "react";
import { ArrowUp, Plus, X, FileText, Mic, Square } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useVoiceRecorder } from "@/hooks/useVoice";
import ChatCommandMenu from "./ChatCommandMenu";
import type { QuickActionConfig } from "./types";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (attachedFileContent?: string, attachedFileName?: string) => void;
  placeholder: string;
  isLoading: boolean;
  fullPage: boolean;
  /** "docked": pinned under the conversation; "inline": part of the page (empty state, widgets). */
  variant?: "docked" | "inline";
  footer?: React.ReactNode;
  voiceEnabled?: boolean;
  commands?: QuickActionConfig[];
  onCommandSelect?: (message: string) => void;
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
  variant,
  footer,
  voiceEnabled = false,
  commands = [],
  onCommandSelect,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [commandMenuOpen, setCommandMenuOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");

  // Detect @ trigger
  const handleInputChange = (newValue: string) => {
    onChange(newValue);

    if (commands.length > 0) {
      const atMatch = newValue.match(/@(\S*)$/);
      if (atMatch) {
        setCommandMenuOpen(true);
        setCommandQuery(atMatch[1]);
      } else {
        setCommandMenuOpen(false);
        setCommandQuery("");
      }
    }
  };

  const handleCommandSelect = (cmd: { message: string }) => {
    setCommandMenuOpen(false);
    setCommandQuery("");
    onChange("");
    onCommandSelect?.(cmd.message);
  };

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
    if (commandMenuOpen) return; // Let CommandMenu handle keys
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

  const docked = (variant ?? (fullPage ? "docked" : "inline")) === "docked";
  const canSend = (!!value.trim() || !!attachedFile) && !isLoading && !isReadingFile;

  return (
    <div className={docked ? "shrink-0 bg-background pb-3 pt-1" : ""}>
      {/* Docked: same column as the messages (max-w-3xl, px-4/6), so the composer lines up with the text */}
      <div className={docked ? "relative mx-auto max-w-3xl px-4 sm:px-6" : "relative mx-auto max-w-3xl"}>
        {/* @ command menu */}
        <ChatCommandMenu
          query={commandQuery}
          commands={commands}
          onSelect={handleCommandSelect}
          onDismiss={() => setCommandMenuOpen(false)}
          visible={commandMenuOpen}
        />
        <div className="relative rounded-[28px] border border-border bg-background shadow-[0_1px_6px_-1px_hsl(var(--foreground)/0.08)] transition-shadow focus-within:shadow-[0_2px_12px_-2px_hsl(var(--foreground)/0.14)]">
          {attachedFile && (
            <div className="px-4 pt-3">
              <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <FileText className="h-4 w-4 shrink-0" />
                <span className="max-w-[200px] truncate font-medium text-foreground">{attachedFile.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-muted hover:text-foreground"
                  aria-label="Remove file"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          <label className="sr-only" htmlFor="chat-composer">Message</label>
          <textarea
            id="chat-composer"
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              handleInputChange(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="block min-h-[52px] max-h-[220px] w-full resize-none overflow-y-auto bg-transparent px-5 pb-1 pt-4 text-[15px] leading-6 text-foreground placeholder:text-muted-foreground focus:outline-none"
            rows={1}
            disabled={isLoading || isReadingFile}
            autoFocus
          />

          <div className="flex items-center justify-between px-2.5 pb-2.5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isReadingFile}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                aria-label="Attach a file (PDF, Markdown or text)"
                title="Attach a file"
              >
                <Plus className="h-5 w-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {voiceEnabled && (
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={isLoading}
                  className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-colors disabled:opacity-30 ${
                    isRecording ? "bg-destructive/10 text-destructive" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  aria-label={isRecording ? "Stop recording" : "Voice input"}
                >
                  {isRecording ? <Square className="h-3.5 w-3.5 fill-current" /> : <Mic className="h-[18px] w-[18px]" />}
                </button>
              )}
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-85 disabled:bg-muted-foreground/25 disabled:text-background"
                aria-label="Send message"
              >
                <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.25} />
              </button>
            </div>
          </div>
        </div>
        {footer && <div className="pt-2 text-center text-xs text-muted-foreground">{footer}</div>}
      </div>
    </div>
  );
};

export default ChatInput;
