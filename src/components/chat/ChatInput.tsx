// ============================================
// Chat Input Component
// Text input with send button
// ============================================

import React, { useRef, useEffect } from "react";
import { Send } from "lucide-react";
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
    <div className={fullPage ? "shrink-0 border-t border-border/30" : "glass-card shadow-apple mt-4"}>
      <div className="p-6">
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
            className="input-field w-full pr-16 resize-none text-base min-h-[52px] max-h-[200px] overflow-y-auto"
            rows={1}
            disabled={isLoading}
          />
          <Button
            onClick={onSend}
            disabled={!value.trim() || isLoading}
            size="icon"
            className="absolute bottom-3 right-3 h-9 w-9 shadow-sm transition-opacity hover:opacity-90"
            style={{ borderRadius: 'var(--radius)' }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
