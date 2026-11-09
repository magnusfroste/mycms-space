// ============================================
// Modules — grouped tables (see docs/redesign/Modules.dc.html)
// ============================================

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useAllModules } from '@/models/modules';
import { updateModule } from '@/data/modules';
import {
  isModuleEnabled,
  moduleGroupLabels,
  moduleRegistry,
  type McpCoverage,
  type ModuleGroup,
  type ModuleRegistryEntry,
} from '@/lib/constants/moduleRegistry';
import type { ModuleType } from '@/types/modules';
import { AdminPageHeader } from './shell/AdminPageHeader';
import { AdminLink, toneClasses, type Tone } from './shell/primitives';
import type { AdminViewId } from './shell/nav';
import { cn } from '@/lib/utils';

const mcpLabel: Record<McpCoverage, { text: string; tone: Tone }> = {
  full: { text: 'Full', tone: 'success' },
  part: { text: 'Partly', tone: 'warning' },
  no: { text: 'Not yet', tone: 'danger' },
  na: { text: '—', tone: 'neutral' },
};

const groups: ModuleGroup[] = ['core', 'content', 'agents'];

const ModulesManager = () => {
  const { data: modules = [], isLoading } = useAllModules();
  const queryClient = useQueryClient();
  const [pendingType, setPendingType] = useState<ModuleType | null>(null);

  const enabled = (entry: ModuleRegistryEntry) => isModuleEnabled(entry, modules);

  const handleToggle = async (entry: ModuleRegistryEntry, on: boolean) => {
    if (!on) {
      const dependents = moduleRegistry.filter((e) => e.dependencies?.includes(entry.type) && enabled(e));
      if (dependents.length > 0) {
        toast.warning(`${dependents.map((d) => d.name).join(', ')} depends on ${entry.name} and may stop working`);
      }
    }
    setPendingType(entry.type);
    try {
      await updateModule(entry.type, { enabled: on });
      await queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast.success(`${entry.name} ${on ? 'switched on' : 'switched off'}`);
    } catch {
      toast.error(`Could not update ${entry.name}`);
    } finally {
      setPendingType(null);
    }
  };

  const optional = moduleRegistry.filter((m) => !m.locked);
  const optionalOn = optional.filter(enabled).length;
  const coreCount = moduleRegistry.length - optional.length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Modules"
        description="Features you can switch on and off. Turning one off hides it on the site, in this admin and in the MCP tools. Core modules are always on."
        actions={
          <>
            <span className="inline-flex h-[26px] items-center rounded-full bg-muted px-2.5 text-[12.5px] font-medium text-foreground/80">
              {coreCount} core
            </span>
            <span
              className={cn(
                'inline-flex h-[26px] items-center rounded-full px-2.5 text-[12.5px] font-medium',
                optionalOn === optional.length ? toneClasses.success.pill : toneClasses.neutral.pill,
              )}
            >
              {optional.length} optional · {optionalOn === optional.length ? 'all on' : `${optionalOn} on`}
            </span>
          </>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : (
        groups.map((group) => {
          const entries = moduleRegistry.filter((m) => m.group === group);
          return (
            <section key={group} className="space-y-2.5">
              <div>
                <h2 className="text-sm font-semibold">{moduleGroupLabels[group].title}</h2>
                <p className="mt-0.5 text-[12.5px] text-muted-foreground">{moduleGroupLabels[group].hint}</p>
              </div>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[720px] border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-muted/40 text-left text-muted-foreground">
                      <th scope="col" className="w-[22%] px-4 py-2.5 text-xs font-medium">Module</th>
                      <th scope="col" className="px-4 py-2.5 text-xs font-medium">What it adds</th>
                      <th scope="col" className="w-[15%] px-4 py-2.5 text-xs font-medium">Admin</th>
                      <th scope="col" className="w-[11%] px-4 py-2.5 text-xs font-medium">MCP</th>
                      <th scope="col" className="w-[9%] px-4 py-2.5 text-right text-xs font-medium">On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((m) => {
                      const mcp = mcpLabel[m.mcp];
                      return (
                        <tr key={m.type} className="border-t border-border/70">
                          <td className="px-4 py-3 font-semibold">{m.name}</td>
                          <td className="px-4 py-3 text-foreground/80">{m.description}</td>
                          <td className="px-4 py-3">
                            <AdminLink view={m.admin.view as AdminViewId} section={m.admin.section} className="text-[12.5px]">
                              {m.admin.label}
                            </AdminLink>
                          </td>
                          <td className={cn('px-4 py-3 text-xs font-semibold', toneClasses[mcp.tone].text)}>{mcp.text}</td>
                          <td className="px-4 py-3 text-right">
                            {m.locked ? (
                              <span className="text-xs text-muted-foreground">Always</span>
                            ) : (
                              <Switch
                                checked={enabled(m)}
                                disabled={pendingType === m.type}
                                onCheckedChange={(on) => handleToggle(m, on)}
                                aria-label={`${enabled(m) ? 'Turn off' : 'Turn on'} ${m.name}`}
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })
      )}

      <p className="text-[12.5px] text-muted-foreground">
        Not built yet and removed from this list: forms builder, e-commerce, multi-language and CRM. They live in the roadmap instead.
      </p>
    </div>
  );
};

export default ModulesManager;
