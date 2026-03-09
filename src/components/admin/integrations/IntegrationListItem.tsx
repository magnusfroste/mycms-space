import React from 'react';
import { Check, Circle, AlertCircle, Key, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type IntegrationStatus = boolean | 'requires_secret' | 'connected';

interface IntegrationListItemProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
  isActive: boolean;
  isAvailable: boolean;
  isConfigured: IntegrationStatus;
  onClick: () => void;
}

const IntegrationListItem: React.FC<IntegrationListItemProps> = ({
  name,
  description,
  icon,
  iconColor,
  isActive,
  isAvailable,
  isConfigured,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left hover:bg-muted/50 ${
        isActive ? 'border-primary bg-primary/5' : 'border-border'
      } ${!isAvailable ? 'opacity-50' : ''}`}
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted ${iconColor}`}>
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{name}</span>
          {isActive && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0">
              Active
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>

      {/* Status indicator */}
      <div className="shrink-0 flex items-center gap-2">
        {!isAvailable ? (
          <Badge variant="outline" className="text-[10px]">Soon</Badge>
        ) : isConfigured === 'connected' ? (
          <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500" />
        ) : isConfigured === true ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : isConfigured === 'requires_secret' ? (
          <Key className="h-3.5 w-3.5 text-blue-500" />
        ) : (
          <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </button>
  );
};

export default IntegrationListItem;
