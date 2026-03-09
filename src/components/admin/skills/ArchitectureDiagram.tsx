import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSkills } from '@/hooks/useSkillHub';
import {
  Globe, Lock, Layers, Cpu, Database, Radio, Bot, ArrowRight, Workflow,
} from 'lucide-react';

const HANDLER_META: Record<string, { label: string; icon: typeof Cpu; color: string }> = {
  edge: { label: 'Edge Function', icon: Cpu, color: 'text-blue-500' },
  builtin: { label: 'Built-in', icon: Layers, color: 'text-emerald-500' },
  module: { label: 'Module', icon: Workflow, color: 'text-amber-500' },
  db: { label: 'Database', icon: Database, color: 'text-violet-500' },
  a2a: { label: 'Federation', icon: Radio, color: 'text-rose-500' },
};

const SCOPE_META: Record<string, { label: string; icon: typeof Globe; color: string }> = {
  public: { label: 'Public', icon: Globe, color: 'border-green-300 bg-green-500/10 text-green-700 dark:text-green-400' },
  internal: { label: 'Internal', icon: Lock, color: 'border-blue-300 bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  both: { label: 'Both', icon: Layers, color: 'border-purple-300 bg-purple-500/10 text-purple-700 dark:text-purple-400' },
  federation: { label: 'Federation', icon: Radio, color: 'border-rose-300 bg-rose-500/10 text-rose-700 dark:text-rose-400' },
};

export default function ArchitectureDiagram() {
  const { data: skills = [], isLoading } = useSkills();

  const handlerGroups = useMemo(() => {
    const groups: Record<string, typeof skills> = {};
    for (const s of skills) {
      const [type] = s.handler.split(':');
      if (!groups[type]) groups[type] = [];
      groups[type].push(s);
    }
    return groups;
  }, [skills]);

  const scopeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of skills) {
      counts[s.scope] = (counts[s.scope] || 0) + 1;
    }
    return counts;
  }, [skills]);

  if (isLoading) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Skill Architecture</CardTitle>
        <CardDescription>How tools flow from visitor chat to execution</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Flow diagram */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
          {[
            { label: 'Visitor Chat', sub: 'ai-chat' },
            { label: 'Agent Loop', sub: 'ai-agent.ts' },
            { label: 'Tool Selection', sub: 'Dynamic from DB' },
            { label: 'Handler Dispatch', sub: 'agent-execute' },
            { label: 'Execution', sub: 'edge / builtin / a2a' },
          ].map((step, i, arr) => (
            <div key={step.label} className="flex items-center gap-2 shrink-0">
              <div className="rounded-lg border bg-muted/50 px-3 py-2 text-center min-w-[100px]">
                <p className="font-medium text-foreground">{step.label}</p>
                <p className="text-muted-foreground text-[10px] mt-0.5">{step.sub}</p>
              </div>
              {i < arr.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            </div>
          ))}
        </div>

        {/* Scope breakdown */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Scopes</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(scopeCounts).map(([scope, count]) => {
              const meta = SCOPE_META[scope] || SCOPE_META.internal;
              const Icon = meta.icon;
              return (
                <Badge key={scope} variant="outline" className={`gap-1.5 ${meta.color}`}>
                  <Icon className="h-3 w-3" />
                  {meta.label}
                  <span className="font-mono text-[10px] opacity-70">{count}</span>
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Handler groups */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-3">Handler Types</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(handlerGroups).map(([type, groupSkills]) => {
              const meta = HANDLER_META[type] || HANDLER_META.edge;
              const Icon = meta.icon;
              return (
                <div key={type} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${meta.color}`} />
                    <span className="text-sm font-medium">{meta.label}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{groupSkills.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {groupSkills.map((s) => (
                      <Badge
                        key={s.id}
                        variant="secondary"
                        className="text-[10px] font-normal"
                      >
                        {s.enabled ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 shrink-0" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 mr-1 shrink-0" />
                        )}
                        {s.name.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
