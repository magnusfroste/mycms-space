// ============================================
// Overview — the control room's front page (see docs/redesign/Main.dc.html)
// ============================================

import { useMemo, useState } from 'react';
import { differenceInDays, format, formatDistanceToNow } from 'date-fns';
import { useAIModule } from '@/models/modules';
import { useAutomations } from '@/hooks/useAutomations';
import { AdminPageHeader } from '@/components/admin/shell/AdminPageHeader';
import {
  AdminLink,
  Dot,
  KpiTile,
  Panel,
  Segmented,
  TonePill,
  tableStyles as t,
  type Tone,
} from '@/components/admin/shell/primitives';
import type { AdminViewId } from '@/components/admin/shell/nav';
import { useReviewCount } from '@/components/admin/review/reviewData';
import { useAutopilotStats, useOperators } from '@/components/admin/agents/agentsData';
import { useGmailStatus } from '@/components/admin/integrations/useGmailStatus';
import { periodLabels, useOverviewData, useOverviewStatus, type Period } from './overview/useOverviewData';
import { cn } from '@/lib/utils';

const fmt = new Intl.NumberFormat('en-GB');

const pct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);

function change(now: number, prior: number): { text: string; tone?: Tone } {
  if (prior === 0) return now === 0 ? { text: 'No change' } : { text: `+${fmt.format(now)} vs before`, tone: 'success' };
  const diff = ((now - prior) / prior) * 100;
  const sign = diff > 0 ? '+' : diff < 0 ? '−' : '±';
  return { text: `${sign}${Math.abs(diff).toFixed(1)}%`, tone: diff > 0 ? 'success' : diff < 0 ? 'warning' : undefined };
}

function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const when = (iso: string | null) => {
  if (!iso) return 'never';
  const d = new Date(iso);
  const days = differenceInDays(new Date(), d);
  if (days < 1) return `today ${format(d, 'HH:mm')}`;
  if (days < 2) return `yesterday ${format(d, 'HH:mm')}`;
  if (days < 7) return formatDistanceToNow(d, { addSuffix: true });
  return format(d, 'd MMM');
};

interface AttentionItem {
  tag: string;
  tone: Tone;
  title: string;
  why: string;
  action: string;
  view: AdminViewId;
  section?: string;
}

export default function OverviewView() {
  const [period, setPeriod] = useState<Period>('month');
  const labels = periodLabels[period];
  const { data, isLoading } = useOverviewData(period);
  const { data: status } = useOverviewStatus();
  const { data: reviewCount = 0 } = useReviewCount();
  const { data: autopilot } = useAutopilotStats();
  const { data: operators = [] } = useOperators();
  const { data: automations = [] } = useAutomations();
  const { data: gmail } = useGmailStatus();
  const { config: aiConfig, isEnabled: magnetOn } = useAIModule();

  const host = typeof window !== 'undefined' ? window.location.host : 'the site';

  const attention = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];
    if (gmail?.needs_reconnect) {
      items.push({
        tag: 'Integration',
        tone: 'danger',
        title: 'Gmail needs to be reconnected',
        why: 'Its access has expired, so inbox scans and signal reports have stopped.',
        action: 'Reconnect',
        view: 'integrations',
      });
    }
    if (reviewCount > 0) {
      items.push({
        tag: 'Review',
        tone: 'warning',
        title: `${fmt.format(reviewCount)} item${reviewCount === 1 ? '' : 's'} waiting for your decision`,
        why: 'Autopilot proposes work but never publishes on its own.',
        action: 'Review',
        view: 'review',
      });
    }
    if (status && status.unread > 0) {
      items.push({
        tag: 'Inbox',
        tone: 'warning',
        title: `${status.unread} unread message${status.unread === 1 ? '' : 's'}`,
        why: 'Someone reached out through the contact form.',
        action: 'Open inbox',
        view: 'inbox',
      });
    }
    if (autopilot && autopilot.failed7d > 0) {
      items.push({
        tag: 'Autopilot',
        tone: 'danger',
        title: `${autopilot.failed7d} failed run${autopilot.failed7d === 1 ? '' : 's'} this week`,
        why: 'A duty did not finish. Check which skill fails and whether it still makes sense.',
        action: 'See duties',
        view: 'agents',
      });
    }
    const erroring = automations.filter((a) => a.enabled && a.last_error).length;
    if (erroring > 0) {
      items.push({
        tag: 'Autopilot',
        tone: 'warning',
        title: `${erroring} automation${erroring === 1 ? '' : 's'} reported an error last time`,
        why: 'The last run ended with an error message.',
        action: 'Open',
        view: 'agents',
      });
    }
    if (status?.knowledgeUpdatedAt) {
      const days = differenceInDays(new Date(), new Date(status.knowledgeUpdatedAt));
      if (days > 30) {
        items.push({
          tag: 'Content',
          tone: 'neutral',
          title: `Knowledge base unchanged for ${days} days`,
          why: 'Magnet answers from it. Add your latest assignment so the chat stays current.',
          action: 'Update',
          view: 'knowledge',
        });
      }
    }
    if (status && status.notFound7d > 0) {
      items.push({
        tag: 'Broken',
        tone: 'warning',
        title: `${status.notFound7d} visit${status.notFound7d === 1 ? '' : 's'} hit a 404 this week`,
        why: 'Old links still point to pages that no longer exist.',
        action: 'See pages',
        view: 'analytics',
      });
    }
    return items;
  }, [gmail, reviewCount, status, autopilot, automations]);

  const inquiries = data?.inquiries ?? 0;
  const inquiryChange = data ? inquiries - data.inquiriesPrior : 0;
  const visitors = data?.visitors ?? 0;
  const chats = data?.chats ?? 0;
  const visitorChange = data ? change(data.visitors, data.visitorsPrior) : undefined;

  const activeOperators = operators.filter((o) => !o.revoked);
  const enabledAutomations = automations.filter((a) => a.enabled).length;
  const model =
    (aiConfig?.integration as { model?: string } | undefined)?.model || aiConfig?.active_integration || '—';
  const maxViews = data?.topPages[0]?.views ?? 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Overview"
        description={`${greeting()}. Here is how ${host} is doing ${labels.phrase}.`}
        actions={
          <Segmented
            label="Period"
            value={period}
            onChange={(v) => setPeriod(v as Period)}
            options={[
              { value: '7d', label: '7 days' },
              { value: 'month', label: 'This month' },
              { value: '90d', label: '90 days' },
            ]}
          />
        }
      />

      {/* North star + funnel */}
      <section
        aria-labelledby="north-star"
        className="grid gap-8 rounded-xl border border-border bg-card p-6 md:grid-cols-2"
      >
        <div className="flex flex-col gap-2.5">
          <p id="north-star" className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ring">
            North star · Inquiries
          </p>
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-5xl font-semibold tracking-[-0.02em]">
              {isLoading ? '…' : fmt.format(inquiries)}
            </span>
            {data && (
              <span
                className={cn(
                  'text-[13px] font-medium',
                  inquiryChange > 0 ? 'text-success' : inquiryChange < 0 ? 'text-warning' : 'text-muted-foreground',
                )}
              >
                {inquiryChange > 0 ? '+' : inquiryChange < 0 ? '−' : '±'}
                {Math.abs(inquiryChange)} vs {labels.prior}
              </span>
            )}
          </div>
          <p className="max-w-[380px] text-[13.5px] leading-relaxed text-foreground/80">
            Clients and recruiters who reached out through the contact form {labels.phrase}. Everything else on this page
            exists to move this number.
          </p>
          <AdminLink view="inbox">Open inbox →</AdminLink>
        </div>
        <div className="flex flex-col gap-3.5">
          <p className="text-xs text-muted-foreground">From visit to inquiry, {labels.phrase}</p>
          {[
            { label: 'Visitors', value: visitors, share: 100 },
            { label: 'Started a chat with Magnet', value: chats, share: pct(chats, visitors) },
            { label: 'Sent an inquiry', value: inquiries, share: pct(inquiries, visitors) },
          ].map((step, i) => (
            <div key={step.label} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[13px]">
                <span>{step.label}</span>
                <span className="font-mono">
                  {fmt.format(step.value)}
                  {i > 0 && visitors > 0 && ` · ${step.share.toFixed(1)}%`}
                </span>
              </div>
              <div className="h-2 rounded bg-muted">
                <div
                  className="h-2 rounded bg-ring"
                  style={{ width: `${step.value > 0 ? Math.max(step.share, 1.5) : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* KPI tiles */}
      <section aria-label="Key numbers" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile
          label={`Visitors · ${labels.short.toLowerCase()}`}
          value={fmt.format(visitors)}
          loading={isLoading}
          hint={visitorChange ? `${visitorChange.text} vs ${labels.prior}` : undefined}
          hintTone={visitorChange?.tone}
        />
        <KpiTile
          label={`Chat conversations · ${labels.short.toLowerCase()}`}
          value={fmt.format(chats)}
          loading={isLoading}
          hint={data ? `${fmt.format(data.chatsPrior)} in the ${labels.prior}` : undefined}
        />
        <KpiTile
          label="Published posts"
          value={status ? fmt.format(status.published) : '…'}
          hint={
            status
              ? `${status.lastPublishedAt ? `Last one ${format(new Date(status.lastPublishedAt), 'd MMM')} · ` : ''}${status.drafts} draft${status.drafts === 1 ? '' : 's'}`
              : undefined
          }
        />
        <KpiTile
          label="Newsletter subscribers"
          value={status ? fmt.format(status.subscribers) : '…'}
          hint={status ? `${status.pendingSubscribers} waiting for confirmation` : undefined}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Needs your attention */}
        <Panel
          className="lg:col-span-3"
          title="Needs your attention"
          actions={<span className="text-xs text-muted-foreground">{attention.length} item{attention.length === 1 ? '' : 's'}</span>}
        >
          {attention.length === 0 ? (
            <div className="px-[18px] py-10 text-center">
              <p className="text-sm font-semibold">All clear</p>
              <p className="mt-1 text-[13px] text-muted-foreground">Nothing is waiting for you. Operators and Autopilot are keeping things running.</p>
            </div>
          ) : (
            <ul>
              {attention.map((row, i) => (
                <li key={`${row.tag}-${i}`} className={cn('flex items-center gap-3.5 px-[18px] py-3.5', i > 0 && 'border-t border-border/70')}>
                  <TonePill tone={row.tone}>{row.tag}</TonePill>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-medium">{row.title}</p>
                    <p className="mt-0.5 text-[12.5px] text-muted-foreground">{row.why}</p>
                  </div>
                  <AdminLink view={row.view} section={row.section} className="shrink-0">
                    {row.action}
                  </AdminLink>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Agents */}
        <Panel className="lg:col-span-2" title="Agents" actions={<AdminLink view="agents">Open →</AdminLink>}>
          <ul>
            {activeOperators.map((op) => (
              <li key={op.id} className="flex items-start gap-3 border-b border-border/70 px-[18px] py-3.5">
                <Dot tone={op.calls30d > 0 ? 'success' : 'neutral'} className="mt-[5px]" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold">
                    {op.name} <span className="font-normal text-muted-foreground">· Operator via MCP</span>
                  </p>
                  <p className="mt-0.5 font-mono text-[12.5px] text-foreground/80">
                    last call {when(op.lastCall)} · {op.calls30d} calls / 30 d
                  </p>
                </div>
              </li>
            ))}
            <li className="flex items-start gap-3 border-b border-border/70 px-[18px] py-3.5">
              <Dot
                tone={autopilot && (autopilot.failed7d > 0 || autopilot.waiting > 10) ? 'warning' : 'success'}
                className="mt-[5px]"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold">
                  Autopilot <span className="font-normal text-muted-foreground">· keeps things running</span>
                </p>
                <p className="mt-0.5 font-mono text-[12.5px] text-foreground/80">
                  {enabledAutomations} automations · {autopilot?.waiting ?? 0} waiting · {autopilot?.failed7d ?? 0} failed / 7 d
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3 px-[18px] py-3.5">
              <Dot tone={magnetOn ? 'success' : 'neutral'} className="mt-[5px]" />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold">
                  Magnet <span className="font-normal text-muted-foreground">· talks to visitors</span>
                </p>
                <p className="mt-0.5 font-mono text-[12.5px] text-foreground/80">
                  {magnetOn ? model : 'switched off'} · {chats} chats · {status?.knowledgeDocs ?? 0} knowledge docs
                </p>
              </div>
            </li>
          </ul>
          {activeOperators.length === 0 && (
            <div className="border-t border-border/70 px-[18px] py-3 text-[12.5px] text-muted-foreground">
              No operator connected yet. <AdminLink view="agents" className="text-[12.5px]">Connect an agent</AdminLink>
            </div>
          )}
        </Panel>
      </div>

      {/* Most visited */}
      <Panel title={`Most visited · ${labels.short.toLowerCase()}`} actions={<AdminLink view="analytics">All analytics →</AdminLink>}>
        {data && data.topPages.length === 0 ? (
          <p className="px-[18px] py-8 text-center text-[13px] text-muted-foreground">No page views in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className={t.table}>
              <thead>
                <tr className={t.headRow}>
                  <th scope="col" className={t.th}>Page</th>
                  <th scope="col" className={`${t.th} w-1/2`}>Share</th>
                  <th scope="col" className={`${t.th} text-right`}>Views</th>
                </tr>
              </thead>
              <tbody>
                {(data?.topPages ?? []).map((p) => {
                  const broken = p.slug === '404';
                  const path = broken ? '404' : p.slug === 'home' || p.slug === '' ? '/' : `/${p.slug.replace(/^\//, '')}`;
                  return (
                    <tr key={p.slug} className={t.row}>
                      <td className={`${t.td} py-2.5 font-mono text-[12.5px]`}>{path}</td>
                      <td className={`${t.td} py-2.5`}>
                        <div className="h-1.5 rounded-sm bg-muted">
                          <div
                            className={cn('h-1.5 rounded-sm', broken ? 'bg-warning' : 'bg-ring')}
                            style={{ width: `${maxViews ? Math.round((p.views / maxViews) * 100) : 0}%` }}
                          />
                        </div>
                      </td>
                      <td className={`${t.td} py-2.5 text-right font-mono`}>{fmt.format(p.views)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
