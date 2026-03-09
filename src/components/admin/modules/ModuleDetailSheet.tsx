import React from 'react';
import { createPortal } from 'react-dom';
import {
  Blocks,
  Lock,
  Check,
  Clock,
  ExternalLink,
  ArrowRight,
  GitBranch,
  Tag,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
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
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!mounted || !open || !entry) return null;

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

  return createPortal(
    <div className="fixed inset-0 z-[120]">
      <button
        type="button"
        aria-label="Close module details"
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-label={`${entry.name} module details`}
        className="absolute right-0 top-0 h-full w-full max-w-md border-l border-border bg-background shadow-xl animate-slide-in-right"
      >
        <div className="h-full overflow-y-auto p-6">
          <header className="pb-4">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${isComingSoon ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{entry.name}</h2>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">v{entry.version}</span>
                  {entry.author && <span className="text-xs text-muted-foreground">by {entry.author}</span>}
                </div>
              </div>
            </div>
          </header>

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
            <h4 className="mb-2 text-sm font-medium">About</h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {entry.longDescription || entry.description}
            </p>
          </div>

          {entry.tags && entry.tags.length > 0 && (
            <div className="pb-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {entry.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[10px] font-normal">
                    <Tag className="mr-1 h-2.5 w-2.5" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {depModules.length > 0 && (
            <>
              <div className="py-4">
                <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
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
              <h4 className="mb-3 text-sm font-medium">Changelog</h4>
              <div className="space-y-4">
                {entry.changelog.map((log) => (
                  <div key={log.version}>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-mono text-xs font-medium">v{log.version}</span>
                      <span className="text-[10px] text-muted-foreground">{log.date}</span>
                    </div>
                    <ul className="space-y-0.5">
                      {log.changes.map((change, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <span className="mt-1 text-primary">•</span>
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
                <Button variant="outline" className="w-full gap-2" onClick={handleConfigure}>
                  <ExternalLink className="h-4 w-4" />
                  Configure {entry.name}
                  <ArrowRight className="ml-auto h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>,
    document.body
  );
};

export default ModuleDetailSheet;
