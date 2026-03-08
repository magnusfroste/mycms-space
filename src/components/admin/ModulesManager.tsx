// ============================================
// Modules Manager — Marketplace View
// Searchable module listing with status badges
// ============================================

import React, { useState, useMemo } from 'react';
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
  Check,
  Clock,
  ClipboardList,
  ShoppingCart,
  Languages,
  Network,
  Users,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAllModules } from '@/models/modules';
import { useQueryClient } from '@tanstack/react-query';
import { updateModule } from '@/data/modules';
import {
  moduleRegistry,
  moduleCategoryLabels,
  type ModuleRegistryEntry,
} from '@/lib/constants/moduleRegistry';
import type { ModuleType } from '@/types/modules';
import { toast } from 'sonner';

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
  ClipboardList,
  ShoppingCart,
  Languages,
  Network,
  Users,
};

const ModuleCard: React.FC<{
  entry: ModuleRegistryEntry;
  isEnabled: boolean;
  onToggle: (type: ModuleType, enabled: boolean) => void;
  isPending: boolean;
}> = ({ entry, isEnabled, onToggle, isPending }) => {
  const Icon = iconMap[entry.icon] || Blocks;
  const isComingSoon = entry.status === 'coming_soon';

  return (
    <Card className={`transition-all ${isComingSoon ? 'opacity-50 border-dashed' : !isEnabled && !entry.locked ? 'opacity-60' : ''}`}>
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
              <Badge variant="default" className="text-[10px] px-1.5 py-0 gap-1 bg-emerald-500/15 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/15">
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
            onCheckedChange={(checked) => onToggle(entry.type as ModuleType, checked)}
            disabled={entry.locked || isPending}
            aria-label={`Toggle ${entry.name}`}
            className="mt-1"
          />
        )}
      </CardContent>
    </Card>
  );
};

const ModulesManager: React.FC = () => {
  const { data: modules = [], isLoading } = useAllModules();
  const queryClient = useQueryClient();
  const [pendingType, setPendingType] = React.useState<ModuleType | null>(null);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const getModuleEnabled = (type: ModuleType): boolean => {
    const entry = moduleRegistry.find((e) => e.type === type);
    const dbModule = modules.find((m) => m.module_type === type);
    if (dbModule) return dbModule.enabled ?? true;
    return entry?.defaultEnabled ?? true;
  };

  const handleToggle = async (type: ModuleType, enabled: boolean) => {
    setPendingType(type);
    try {
      await updateModule(type, { enabled });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      const name = moduleRegistry.find((e) => e.type === type)?.name;
      toast.success(`${name} ${enabled ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to update module');
    } finally {
      setPendingType(null);
    }
  };

  const filteredModules = useMemo(() => {
    let results = moduleRegistry;

    // Category filter
    if (activeCategory !== 'all') {
      results = results.filter((e) => e.category === activeCategory);
    }

    // Search filter
    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    return results;
  }, [query, activeCategory]);

  // Group filtered results by category
  const categories = ['core', 'content', 'integrations', 'tools'];
  const groupedResults = useMemo(() => {
    const groups: Record<string, ModuleRegistryEntry[]> = {};
    for (const cat of categories) {
      const entries = filteredModules.filter((e) => e.category === cat);
      if (entries.length > 0) groups[cat] = entries;
    }
    return groups;
  }, [filteredModules]);

  const installedCount = moduleRegistry.filter((m) => m.status === 'installed').length;
  const activeCount = moduleRegistry.filter(
    (m) => m.status === 'installed' && getModuleEnabled(m.type as ModuleType)
  ).length;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Blocks className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Modules</h2>
          <p className="text-muted-foreground text-sm">
            {activeCount} of {installedCount} modules active
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search modules…"
          className="pl-9 pr-9"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat} className="text-xs">
              {moduleCategoryLabels[cat]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Module list */}
      {Object.keys(groupedResults).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No modules match your search</p>
        </div>
      ) : (
        Object.entries(groupedResults).map(([cat, entries]) => (
          <div key={cat}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {moduleCategoryLabels[cat]}
            </h3>
            <div className="space-y-2">
              {entries.map((entry) => (
                <ModuleCard
                  key={entry.type}
                  entry={entry}
                  isEnabled={entry.status === 'installed' ? getModuleEnabled(entry.type as ModuleType) : false}
                  onToggle={handleToggle}
                  isPending={pendingType === entry.type}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ModulesManager;
