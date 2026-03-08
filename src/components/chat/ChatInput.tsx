// ============================================
// Chat Input Component
// Text input with send button and file upload
// ============================================

import React, { useRef, useEffect, useState } from "react";
import { ArrowUp, Paperclip, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (attachedFileContent?: string, attachedFileName?: string) => void;
  placeholder: string;
  isLoading: boolean;
  fullPage: boolean;
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
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

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
    <div className={fullPage ? "shrink-0 border-t border-border bg-background/80 backdrop-blur-sm shadow-[0_-4px_16px_-4px_hsl(var(--foreground)/0.06)] p-4 sm:p-6" : "mt-4"}>
      <div className="relative max-w-4xl mx-auto">
        {/* Attached file pill */}
        {attachedFile && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="flex items-center gap-1.5 text-xs bg-muted/50 border border-border rounded-lg px-2.5 py-1.5 text-muted-foreground">
              <FileText className="h-3 w-3 shrink-0" />
              <span className="truncate max-w-[200px]">{attachedFile.name}</span>
              <button
                onClick={() => setAttachedFile(null)}
                className="ml-1 hover:text-foreground transition-colors"
                aria-label="Remove file"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="w-full pl-10 pr-14 resize-none text-sm min-h-[48px] max-h-[200px] overflow-y-auto bg-muted/30 border border-border rounded-xl py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
            rows={1}
            disabled={isLoading || isReadingFile}
            autoFocus
          />

          {/* File upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isReadingFile}
            className="absolute bottom-3 left-3 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            aria-label="Attach file"
            type="button"
          >
            <Paperclip className="h-4 w-4" />
          </button>

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
            className="absolute bottom-2.5 right-2.5 h-8 w-8 rounded-lg"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
