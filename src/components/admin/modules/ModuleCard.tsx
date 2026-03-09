import React from 'react';
import { Blocks, Lock, Check, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import type { ModuleRegistryEntry } from '@/lib/constants/moduleRegistry';
import type { ModuleType } from '@/types/modules';
import { iconMap } from './iconMap';

const ModuleCard: React.FC<{
  entry: ModuleRegistryEntry;
  isEnabled: boolean;
  onToggle: (type: ModuleType, enabled: boolean) => void;
  isPending: boolean;
  onClick: () => void;
}> = ({ entry, isEnabled, onToggle, isPending, onClick }) => {
  const Icon = iconMap[entry.icon] || Blocks;
  const isComingSoon = entry.status === 'coming_soon';

  return (
    <Card
      className={`transition-all cursor-pointer hover:ring-1 hover:ring-primary/20 ${isComingSoon ? 'opacity-50 border-dashed' : !isEnabled && !entry.locked ? 'opacity-60' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        // Delay to prevent Radix Dialog from detecting the click as "outside"
        setTimeout(() => onClick(), 0);
      }}
    >
      <CardContent className="flex items-start gap-4 p-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isComingSoon ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-sm">{entry.name}</h3>
            {entry.locked && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                <Lock className="h-2.5 w-2.5" />
                Core
              </Badge>
            )}
            {isComingSoon && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                <Clock className="h-2.5 w-2.5" />
                Coming Soon
              </Badge>
            )}
            {!isComingSoon && !entry.locked && isEnabled && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1 border-primary/30 text-primary">
                <Check className="h-2.5 w-2.5" />
                Active
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {entry.description}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] text-muted-foreground font-mono">
              v{entry.version}
            </span>
            {entry.author && (
              <span className="text-[10px] text-muted-foreground">
                by {entry.author}
              </span>
            )}
          </div>
        </div>
        {!isComingSoon && (
          <Switch
            checked={isEnabled}
            onCheckedChange={(checked) => {
              onToggle(entry.type as ModuleType, checked);
            }}
            disabled={entry.locked || isPending}
            aria-label={`Toggle ${entry.name}`}
            className="mt-1"
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default ModuleCard;
