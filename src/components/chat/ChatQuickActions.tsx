// ============================================
// Chat Quick Actions
// Suggestion pills shown under the composer before the first message
// ============================================

import React from "react";
import { iconMap } from "@/lib/constants/iconMaps";
import type { QuickActionConfig } from "./types";

interface ChatQuickActionsProps {
  actions: QuickActionConfig[];
  onSelect: (message: string) => void;
  isLoading: boolean;
}

const ChatQuickActions: React.FC<ChatQuickActionsProps> = ({ actions, onSelect, isLoading }) => {
  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {actions.map((action) => {
        const icon = iconMap[action.icon];
        return (
          <button
            key={action.id || action.label}
            type="button"
            onClick={() => onSelect(action.message)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3.5 py-2 text-[13.5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 [&_svg]:h-4 [&_svg]:w-4"
          >
            {icon && <span className="shrink-0 opacity-70">{icon}</span>}
            {action.label}
          </button>
        );
      })}
    </div>
  );
};

export default ChatQuickActions;
