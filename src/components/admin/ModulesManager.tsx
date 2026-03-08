// ============================================
// Modules Manager — Marketplace View
// Searchable module listing with detail sheet
// ============================================

import React, { useState, useMemo, useCallback } from 'react';
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
  ExternalLink,
  ArrowRight,
  GitBranch,
  Tag,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useAllModules } from '@/models/modules';
import { useQueryClient } from '@tanstack/react-query';
import { updateModule } from '@/data/modules';
import {
  moduleRegistry,
  moduleCategoryLabels,
  moduleRegistryMap,
  type ModuleRegistryEntry,
} from '@/lib/constants/moduleRegistry';
import type { ModuleType } from '@/types/modules';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';

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

// ── Module Detail Sheet ──────────────────────

const ModuleDetailSheet: React.FC<{
  entry: ModuleRegistryEntry | null;
  open: boolean;
  onClose: () => void;
  isEnabled: boolean;
  onToggle: (type: ModuleType, enabled: boolean) => void;
  isPending: boolean;
}> = ({ entry, open, onClose, isEnabled, onToggle, isPending }) => {
  const [, setSearchParams] = useSearchParams();

  if (!entry) return null;
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

        {/* Status & Toggle */}
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

        {/* Description */}
        <div className="py-4">
          <h4 className="text-sm font-medium mb-2">About</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {entry.longDescription || entry.description}
          </p>
        </div>

        {/* Tags */}
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

        {/* Dependencies */}
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

        {/* Changelog */}
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

        {/* Configure button */}
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

// ── Module Card ──────────────────────────────

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
      onClick={onClick}
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
              // Prevent card click when toggling
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

// ── Main Component ───────────────────────────

const ModulesManager: React.FC = () => {
  const { data: modules = [], isLoading } = useAllModules();
  const queryClient = useQueryClient();
  const [pendingType, setPendingType] = React.useState<ModuleType | null>(null);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedModule, setSelectedModule] = useState<ModuleRegistryEntry | null>(null);

  const getModuleEnabled = useCallback((type: ModuleType): boolean => {
    const entry = moduleRegistry.find((e) => e.type === type);
    const dbModule = modules.find((m) => m.module_type === type);
    if (dbModule) return dbModule.enabled ?? true;
    return entry?.defaultEnabled ?? true;
  }, [modules]);

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
    if (activeCategory !== 'all') {
      results = results.filter((e) => e.category === activeCategory);
    }
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
                  onClick={() => setSelectedModule(entry)}
                />
              ))}
            </div>
          </div>
        ))
      )}

      {/* Detail Sheet */}
      <ModuleDetailSheet
        entry={selectedModule}
        open={!!selectedModule}
        onClose={() => setSelectedModule(null)}
        isEnabled={selectedModule?.status === 'installed' ? getModuleEnabled(selectedModule.type as ModuleType) : false}
        onToggle={handleToggle}
        isPending={pendingType === selectedModule?.type}
      />
    </div>
  );
};

export default ModulesManager;
