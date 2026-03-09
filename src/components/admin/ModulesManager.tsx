// ============================================
// Modules Manager — Marketplace View
// Searchable module listing with detail sheet
// ============================================

import React, { useState, useMemo, useCallback } from 'react';
import { Blocks, Search, X } from 'lucide-react';
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
import ModuleCard from './modules/ModuleCard';
import ModuleDetailSheet from './modules/ModuleDetailSheet';

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
    // Dependency check: warn if disabling a module that others depend on
    if (!enabled) {
      const dependents = moduleRegistry.filter(
        (e) => e.status === 'installed' && e.dependencies?.includes(type) && getModuleEnabled(e.type as ModuleType)
      );
      if (dependents.length > 0) {
        const names = dependents.map((d) => d.name).join(', ');
        toast.warning(`${names} depends on this module and may not work correctly`);
      }
    }

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
        isEnabled={selectedModule ? getModuleEnabled(selectedModule.type as ModuleType) : false}
        onToggle={handleToggle}
        isPending={pendingType === selectedModule?.type}
      />
    </div>
  );
};

export default ModulesManager;
