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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-w-4xl mx-auto">
        {actions.map((action) => {
          const IconComponent = iconMap[action.icon];
          return (
            <Button
              key={action.label}
              onClick={() => onSelect(action.message)}
              disabled={isLoading}
              variant="ghost"
              className="h-auto py-2 px-3 text-xs font-normal justify-start rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              {IconComponent && <span className="mr-1.5">{IconComponent}</span>}
              {action.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default ChatQuickActions;
