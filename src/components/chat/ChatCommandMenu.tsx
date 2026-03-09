// ============================================
// Chat Command Menu
// Inline @-triggered command palette
// ============================================

import React, { useState, useEffect, useRef } from "react";
import type { QuickActionConfig } from "./types";

interface ChatCommandMenuProps {
  query: string;
  commands: QuickActionConfig[];
  onSelect: (command: QuickActionConfig) => void;
  onDismiss: () => void;
  visible: boolean;
}

const ChatCommandMenu: React.FC<ChatCommandMenuProps> = ({
  query,
  commands,
  onSelect,
  onDismiss,
  visible,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.message.toLowerCase().includes(query.toLowerCase())
  );

  // Reset index when query or visibility changes
  useEffect(() => {
    setActiveIndex(0);
  }, [query, visible]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // Keyboard handler — attached to window so it works while textarea has focus
  useEffect(() => {
    if (!visible || filtered.length === 0) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        onSelect(filtered[activeIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onDismiss();
      }
    };

    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [visible, filtered, activeIndex, onSelect, onDismiss]);

  if (!visible || filtered.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-1 z-50">
      <div
        ref={listRef}
        className="mx-auto max-w-3xl bg-popover border border-border rounded-lg shadow-lg overflow-hidden max-h-[200px] overflow-y-auto"
      >
        {filtered.map((cmd, i) => (
          <button
            key={cmd.id}
            onMouseDown={(e) => {
              e.preventDefault(); // Keep textarea focus
              onSelect(cmd);
            }}
            onMouseEnter={() => setActiveIndex(i)}
            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
              i === activeIndex
                ? "bg-accent text-accent-foreground"
                : "text-foreground hover:bg-accent/50"
            }`}
          >
            <span className="text-muted-foreground text-xs font-mono shrink-0">@</span>
            <span className="truncate">{cmd.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatCommandMenu;
