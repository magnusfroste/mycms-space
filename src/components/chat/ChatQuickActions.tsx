// ============================================
// Chat Quick Actions Component
// Grid of quick action buttons
// ============================================

import React from "react";
import { Button } from "@/components/ui/button";
import { iconMap } from "@/lib/constants/iconMaps";
import type { QuickActionConfig } from "./types";

interface ChatQuickActionsProps {
  actions: QuickActionConfig[];
  onSelect: (message: string) => void;
  isLoading: boolean;
}

const ChatQuickActions: React.FC<ChatQuickActionsProps> = ({
  actions,
  onSelect,
  isLoading,
}) => {
  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 max-w-3xl mx-auto">
        {actions.map((action) => {
          const IconComponent = iconMap[action.icon];
          return (
            <button
              key={action.label}
              onClick={() => onSelect(action.message)}
              disabled={isLoading}
              className="h-auto py-2.5 px-3 text-[11px] font-medium uppercase tracking-[0.1em] text-left rounded-lg border border-border/60 bg-transparent text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {IconComponent && <span className="shrink-0 opacity-60">{IconComponent}</span>}
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChatQuickActions;
