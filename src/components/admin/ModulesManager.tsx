// ============================================
// Modules Manager
// Odoo-style module listing with toggle switches
// ============================================

import React from 'react';
import {
  Blocks,
  Bot,
  FolderOpen,
  PenSquare,
  Mail,
  BookUser,
  Github,
  Webhook,
  Globe,
  Search,
  Palette,
  PanelTop,
  PanelBottom,
  BarChart3,
  Lock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useAllModules, useUpdateModule } from '@/models/modules';
import {
  moduleRegistry,
  moduleCategoryLabels,
  type ModuleRegistryEntry,
} from '@/lib/constants/moduleRegistry';
import type { ModuleType } from '@/types/modules';
import { toast } from 'sonner';

// Icon map for registry entries
const iconMap: Record<string, React.ElementType> = {
  PanelTop,
  PanelBottom,
  Palette,
  Search,
  BarChart3,
  FolderOpen,
  PenSquare,
  Mail,
  BookUser,
  Bot,
  Github,
  Webhook,
  Globe,
};

const ModuleCard: React.FC<{
  entry: ModuleRegistryEntry;
  isEnabled: boolean;
  onToggle: (type: ModuleType, enabled: boolean) => void;
  isPending: boolean;
}> = ({ entry, isEnabled, onToggle, isPending }) => {
  const Icon = iconMap[entry.icon] || Blocks;

  return (
    <Card className={`transition-all ${!isEnabled && !entry.locked ? 'opacity-60' : ''}`}>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm">{entry.name}</h3>
            {entry.locked && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                <Lock className="h-2.5 w-2.5" />
                Core
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {entry.description}
          </p>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={(checked) => onToggle(entry.type, checked)}
          disabled={entry.locked || isPending}
          aria-label={`Toggle ${entry.name}`}
        />
      </CardContent>
    </Card>
  );
};

const ModulesManager: React.FC = () => {
  const { data: modules = [], isLoading } = useAllModules();
  const [pendingType, setPendingType] = React.useState<ModuleType | null>(null);

  const getModuleEnabled = (type: ModuleType): boolean => {
    const entry = moduleRegistry.find((e) => e.type === type);
    const dbModule = modules.find((m) => m.module_type === type);
    if (dbModule) return dbModule.enabled ?? true;
    return entry?.defaultEnabled ?? true;
  };

  const handleToggle = async (type: ModuleType, enabled: boolean) => {
    setPendingType(type);
    try {
      const { updateModule } = await import('@/data/modules');
      await updateModule(type, { enabled });
      toast.success(`${moduleRegistry.find((e) => e.type === type)?.name} ${enabled ? 'enabled' : 'disabled'}`);
      // Invalidate react-query
      const { QueryClient } = await import('@tanstack/react-query');
      // We need to use the existing queryClient, so we'll trigger refetch via the hook
    } catch {
      toast.error('Failed to update module');
    } finally {
      setPendingType(null);
    }
  };

  // Group by category
  const categories = ['core', 'content', 'integrations', 'tools'];

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-3">
        <Blocks className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Modules</h2>
          <p className="text-muted-foreground text-sm">
            Enable or disable modules to customize your CMS
          </p>
        </div>
      </div>

      {categories.map((cat) => {
        const entries = moduleRegistry.filter((e) => e.category === cat);
        if (entries.length === 0) return null;

        return (
          <div key={cat}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {moduleCategoryLabels[cat]}
            </h3>
            <div className="space-y-2">
              {entries.map((entry) => (
                <ModuleCard
                  key={entry.type}
                  entry={entry}
                  isEnabled={getModuleEnabled(entry.type)}
                  onToggle={handleToggle}
                  isPending={pendingType === entry.type}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ModulesManager;
