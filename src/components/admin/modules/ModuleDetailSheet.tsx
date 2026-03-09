import React from 'react';
import {
  Blocks,
  Lock,
  Check,
  Clock,
  ExternalLink,
  ArrowRight,
  GitBranch,
  Tag,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { moduleRegistryMap, type ModuleRegistryEntry } from '@/lib/constants/moduleRegistry';
import type { ModuleType } from '@/types/modules';
import { useSearchParams } from 'react-router-dom';
import { iconMap } from './iconMap';

const ModuleDetailSheet: React.FC<{
  entry: ModuleRegistryEntry | null;
  open: boolean;
  onClose: () => void;
  isEnabled: boolean;
  onToggle: (type: ModuleType, enabled: boolean) => void;
  isPending: boolean;
}> = ({ entry, open, onClose, isEnabled, onToggle, isPending }) => {
  const [, setSearchParams] = useSearchParams();

  if (!entry) {
    return (
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="overflow-y-auto sm:max-w-md" />
      </Sheet>
    );
  }

  const Icon = iconMap[entry.icon] || Blocks;
  const isComingSoon = entry.status === 'coming_soon';

  const handleConfigure = () => {
    if (entry.configTab) {
      setSearchParams({ tab: entry.configTab });
      onClose();
    }
  };

  const depModules = (entry.dependencies ?? [])
    .map((d) => moduleRegistryMap.get(d))
    .filter(Boolean) as ModuleRegistryEntry[];

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${isComingSoon ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <SheetTitle className="text-lg">{entry.name}</SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground font-mono">v{entry.version}</span>
                {entry.author && (
                  <span className="text-xs text-muted-foreground">by {entry.author}</span>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            {entry.locked && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Lock className="h-3 w-3" /> Core
              </Badge>
            )}
            {isComingSoon && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Clock className="h-3 w-3" /> Coming Soon
              </Badge>
            )}
            {!isComingSoon && !entry.locked && (
              <Badge variant={isEnabled ? 'default' : 'secondary'} className="gap-1 text-xs">
                {isEnabled ? <Check className="h-3 w-3" /> : null}
                {isEnabled ? 'Active' : 'Disabled'}
              </Badge>
            )}
          </div>
          {!isComingSoon && (
            <Switch
              checked={isEnabled}
              onCheckedChange={(checked) => onToggle(entry.type as ModuleType, checked)}
              disabled={entry.locked || isPending}
            />
          )}
        </div>

        <Separator />

        <div className="py-4">
          <h4 className="text-sm font-medium mb-2">About</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {entry.longDescription || entry.description}
          </p>
        </div>

        {entry.tags && entry.tags.length > 0 && (
          <div className="pb-4">
            <div className="flex items-center gap-1.5 flex-wrap">
              {entry.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px] font-normal">
                  <Tag className="h-2.5 w-2.5 mr-1" />{tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {depModules.length > 0 && (
          <>
            <div className="py-4">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5" /> Dependencies
              </h4>
              <div className="space-y-2">
                {depModules.map((dep) => {
                  const DepIcon = iconMap[dep.icon] || Blocks;
                  return (
                    <div key={dep.type} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DepIcon className="h-4 w-4" />
                      <span>{dep.name}</span>
                      <span className="font-mono text-[10px]">v{dep.version}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <Separator />
          </>
        )}

        {entry.changelog && entry.changelog.length > 0 && (
          <div className="py-4">
            <h4 className="text-sm font-medium mb-3">Changelog</h4>
            <div className="space-y-4">
              {entry.changelog.map((log) => (
                <div key={log.version}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-medium">v{log.version}</span>
                    <span className="text-[10px] text-muted-foreground">{log.date}</span>
                  </div>
                  <ul className="space-y-0.5">
                    {log.changes.map((change, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-primary mt-1">•</span>
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {entry.configTab && !isComingSoon && (
          <>
            <Separator />
            <div className="pt-4">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleConfigure}
              >
                <ExternalLink className="h-4 w-4" />
                Configure {entry.name}
                <ArrowRight className="h-3.5 w-3.5 ml-auto" />
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ModuleDetailSheet;
