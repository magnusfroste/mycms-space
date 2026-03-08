// ============================================
// Chat Input Component
// Text input with send button
// ============================================

import React, { useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder: string;
  isLoading: boolean;
  fullPage: boolean;
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

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  // Reset height when value is cleared
  useEffect(() => {
    if (value === "" && textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className={fullPage ? "shrink-0 border-t border-border bg-background/80 backdrop-blur-sm shadow-[0_-4px_16px_-4px_hsl(var(--foreground)/0.06)] p-4 sm:p-6" : "mt-4"}>
      <div className="relative max-w-4xl mx-auto">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            adjustTextareaHeight();
          }}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="w-full pr-14 resize-none text-sm min-h-[48px] max-h-[200px] overflow-y-auto bg-muted/30 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
          rows={1}
          disabled={isLoading}
          autoFocus
        />
        <Button
          onClick={onSend}
          disabled={!value.trim() || isLoading}
          size="icon"
          className="absolute bottom-2.5 right-2.5 h-8 w-8 rounded-lg"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
