// ============================================
// Autopilot — the internal loop: health, guardrails and duties
// ============================================

import { useEffect, useState } from 'react';
import { differenceInDays, format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useAutomations, useToggleAutomation } from '@/hooks/useAutomations';
import { useAutomationHealth, type AutomationHealthItem } from '@/hooks/useAutomationHealth';
import { AdminLink, Panel, StatusPill, tableStyles as t, toneClasses, type Tone } from '@/components/admin/shell/primitives';
import { taskTypeLabel } from '@/components/admin/review/reviewData';
import { cn } from '@/lib/utils';
import {
  triggerToWords,
  useAutopilotGuardrails,
  useAutopilotStats,
  useSaveAutopilotGuardrails,
} from './agentsData';

const healthWords: Record<AutomationHealthItem['health'], { label: string; tone: Tone }> = {
  healthy: { label: 'OK', tone: 'success' },
  warning: { label: 'Some errors', tone: 'warning' },
  error: { label: 'Failing often', tone: 'danger' },
  stale: { label: 'Idle over 7 days', tone: 'neutral' },
  disabled: { label: 'Paused', tone: 'neutral' },
};

const lastRun = (iso: string | null, runs: number) => {
  if (!iso) return 'Never';
  const d = new Date(iso);
  const days = differenceInDays(new Date(), d);
  const when =
    days < 1 ? `Today ${format(d, 'HH:mm')}` : days < 2 ? `Yesterday ${format(d, 'HH:mm')}` : days < 7 ? formatDistanceToNow(d, { addSuffix: true }) : format(d, 'd MMM');
  return `${when} · ${runs} run${runs === 1 ? '' : 's'}`;
};

function Guardrails() {
  const { data } = useAutopilotGuardrails();
  const save = useSaveAutopilotGuardrails();
  const [maxWaiting, setMaxWaiting] = useState('');
  const [expiry, setExpiry] = useState('');

  useEffect(() => {
    if (data) {
      setMaxWaiting(String(data.guardrails.max_waiting_reviews));
      setExpiry(String(data.guardrails.draft_expiry_days));
    }
  }, [data]);

  const dirty =
    !!data &&
    (Number(maxWaiting) !== data.guardrails.max_waiting_reviews || Number(expiry) !== data.guardrails.draft_expiry_days);
  const valid = Number(maxWaiting) >= 1 && Number(maxWaiting) <= 50 && Number(expiry) >= 1 && Number(expiry) <= 90;

  return (
    <div className="px-[18px] py-3.5">
      <p className="text-xs text-muted-foreground">Guardrails</p>
      <div className="mt-2 space-y-1.5 text-[13px]">
        <label className="flex items-center justify-between gap-2">
          <span>Max waiting</span>
          <Input
            type="number"
            min={1}
            max={50}
            value={maxWaiting}
            onChange={(e) => setMaxWaiting(e.target.value)}
            className="h-7 w-16 px-2 text-right font-mono text-[13px]"
            aria-label="Maximum items waiting for review"
          />
        </label>
        <label className="flex items-center justify-between gap-2">
          <span>Drafts expire (days)</span>
          <Input
            type="number"
            min={1}
            max={90}
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="h-7 w-16 px-2 text-right font-mono text-[13px]"
            aria-label="Days before a draft expires"
          />
        </label>
      </div>
      {dirty && (
        <Button
          size="sm"
          className="mt-2 h-7 w-full text-xs"
          disabled={!valid || save.isPending}
          onClick={() =>
            data &&
            save.mutate(
              {
                guardrails: { max_waiting_reviews: Number(maxWaiting), draft_expiry_days: Number(expiry) },
                current: data.config,
                exists: data.exists,
              },
              {
                onSuccess: () => toast.success('Guardrails saved'),
                onError: (e) => toast.error((e as Error).message),
              },
            )
          }
        >
          Save guardrails
        </Button>
      )}
    </div>
  );
}

export function AutopilotPanel() {
  const { data: stats } = useAutopilotStats();
  const { data: guard } = useAutopilotGuardrails();
  const { data: health } = useAutomationHealth();
  const { data: automations = [] } = useAutomations();
  const toggle = useToggleAutomation();
  const qc = useQueryClient();

  const maxWaiting = guard?.guardrails.max_waiting_reviews ?? 5;
  const queueFull = !!stats && stats.waiting >= maxWaiting;
  const needsTuning = !!stats && (stats.failed7d > 0 || (health?.erroring ?? 0) > 0);
  const overall: { label: string; tone: Tone } = needsTuning
    ? { label: 'Needs tuning', tone: 'warning' }
    : queueFull
      ? { label: 'Paused · queue full', tone: 'neutral' }
      : { label: 'Running', tone: 'success' };

  const waitingBreakdown = stats
    ? Object.entries(stats.waitingByType)
        .map(([type, n]) => `${n} ${taskTypeLabel(type).toLowerCase()}`)
        .join(' · ')
    : '';

  const items = health?.items ?? [];

  return (
    <Panel
      title="Autopilot"
      description="Each cycle: observe the platform → plan the next small step → act through a skill → report to the review queue."
      actions={<StatusPill tone={overall.tone} className="h-6 px-2.5 text-xs font-semibold">{overall.label}</StatusPill>}
    >
      <div className="grid grid-cols-2 border-b border-border lg:grid-cols-4">
        <div className="border-b border-r border-border/70 px-[18px] py-3.5 lg:border-b-0">
          <p className="text-xs text-muted-foreground">Waiting for review</p>
          <p className={cn('mt-1.5 font-mono text-[22px] font-semibold', queueFull && toneClasses.warning.text)}>
            {stats?.waiting ?? '…'}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {waitingBreakdown || 'queue is empty'} · <AdminLink view="review" className="text-xs">open</AdminLink>
          </p>
        </div>
        <div className="border-b border-border/70 px-[18px] py-3.5 lg:border-b-0 lg:border-r">
          <p className="text-xs text-muted-foreground">Failed runs</p>
          <p className={cn('mt-1.5 font-mono text-[22px] font-semibold', (stats?.failed7d ?? 0) > 0 && toneClasses.danger.text)}>
            {stats?.failed7d ?? '…'}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">last 7 days · {stats?.failed ?? 0} all time</p>
        </div>
        <div className="border-r border-border/70 px-[18px] py-3.5">
          <p className="text-xs text-muted-foreground">Completed</p>
          <p className="mt-1.5 font-mono text-[22px] font-semibold">{stats?.completed ?? '…'}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">all time</p>
        </div>
        <Guardrails />
      </div>

      <div className="overflow-x-auto">
        <table className={t.table}>
          <thead>
            <tr className={t.headRow}>
              <th scope="col" className={t.th}>Duty</th>
              <th scope="col" className={t.th}>When</th>
              <th scope="col" className={t.th}>Skill</th>
              <th scope="col" className={t.th}>Last run</th>
              <th scope="col" className={t.th}>Health</th>
              <th scope="col" className={`${t.th} text-right`}>On</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr className={t.row}>
                <td colSpan={6} className={`${t.td} py-8 text-center text-muted-foreground`}>
                  No duties yet. Add one under Automations below.
                </td>
              </tr>
            )}
            {items.map((item) => {
              const auto = automations.find((a) => a.id === item.id);
              const neverRan = item.enabled && item.runCount === 0 && !item.lastTriggeredAt;
              const failedLast = item.enabled && !!item.lastError;
              const h = neverRan
                ? { label: 'Never ran', tone: 'neutral' as Tone }
                : failedLast && item.health === 'healthy'
                  ? { label: 'Last run failed', tone: 'warning' as Tone }
                  : healthWords[item.health];
              return (
                <tr key={item.id} className={cn(t.row, !item.enabled && 'text-muted-foreground')}>
                  <td className={`${t.td} py-2.5 font-medium`}>
                    {item.name.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())}
                    {auto?.description && (
                      <p className="max-w-[260px] truncate text-[12px] font-normal text-muted-foreground">{auto.description}</p>
                    )}
                  </td>
                  <td className={`${t.td} py-2.5 whitespace-nowrap text-foreground/80`}>
                    {triggerToWords(item.triggerType, auto?.trigger_config)}
                  </td>
                  <td className={`${t.td} py-2.5 font-mono text-xs text-foreground/80`}>{item.skillName || '—'}</td>
                  <td className={`${t.td} py-2.5 whitespace-nowrap text-foreground/80`}>{lastRun(item.lastTriggeredAt, item.runCount)}</td>
                  <td className={`${t.td} py-2.5`} title={item.lastError ?? undefined}>
                    <span className={cn('inline-flex items-center gap-1.5 text-[12.5px]', toneClasses[h.tone].text)}>
                      <span className={cn('h-[7px] w-[7px] rounded-full', toneClasses[h.tone].dot)} />
                      {h.label}
                    </span>
                  </td>
                  <td className={`${t.td} py-2.5 text-right`}>
                    <Switch
                      checked={item.enabled}
                      disabled={toggle.isPending}
                      onCheckedChange={(enabled) =>
                        toggle.mutate(
                          { id: item.id, enabled },
                          { onSuccess: () => qc.invalidateQueries({ queryKey: ['automation-health'] }) },
                        )
                      }
                      aria-label={`${item.enabled ? 'Pause' : 'Resume'} ${item.name}`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
