// ============================================
// Small presentational building blocks for the admin ("studio" look):
// hairline panels, status pills, KPI tiles, chips and empty states.
// ============================================

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { AdminViewId } from './nav';

export type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'accent';

export const toneClasses: Record<Tone, { pill: string; dot: string; text: string }> = {
  success: { pill: 'bg-success-soft text-success', dot: 'bg-success', text: 'text-success' },
  warning: { pill: 'bg-warning-soft text-warning', dot: 'bg-warning', text: 'text-warning' },
  danger: { pill: 'bg-danger-soft text-destructive', dot: 'bg-destructive', text: 'text-destructive' },
  neutral: { pill: 'bg-muted text-foreground/80', dot: 'bg-muted-foreground/50', text: 'text-muted-foreground' },
  accent: { pill: 'bg-ring/10 text-ring', dot: 'bg-ring', text: 'text-ring' },
};

export const adminHref = (view: AdminViewId, section?: string, extra?: Record<string, string>) => {
  const params = new URLSearchParams({ tab: view });
  if (section) params.set('section', section);
  if (extra) Object.entries(extra).forEach(([k, v]) => params.set(k, v));
  return `/admin?${params.toString()}`;
};

export function AdminLink({
  view,
  section,
  extra,
  children,
  className,
}: {
  view: AdminViewId;
  section?: string;
  extra?: Record<string, string>;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={adminHref(view, section, extra)}
      className={cn('text-[13px] font-medium text-ring hover:underline underline-offset-2', className)}
    >
      {children}
    </Link>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn('overflow-hidden rounded-xl border border-border bg-card', className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-[18px] py-3.5">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold tracking-normal text-foreground">{title}</h2>}
            {description && <p className="mt-0.5 text-[12.5px] text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function StatusPill({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-[11.5px] font-medium',
        toneClasses[tone].pill,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', toneClasses[tone].dot)} />
      {children}
    </span>
  );
}

export function TonePill({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-[22px] shrink-0 items-center whitespace-nowrap rounded-full px-2 text-[11.5px] font-semibold',
        toneClasses[tone].pill,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Dot({ tone, className }: { tone: Tone; className?: string }) {
  return <span className={cn('inline-block h-2 w-2 shrink-0 rounded-full', toneClasses[tone].dot, className)} />;
}

export function Chip({ children, mono, className }: { children: ReactNode; mono?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[11.5px] text-foreground/80',
        mono && 'font-mono',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground', className)}>
      {children}
    </p>
  );
}

export function KpiTile({
  label,
  value,
  hint,
  hintTone,
  loading,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  hintTone?: Tone;
  loading?: boolean;
}) {
  return (
    <div className="rounded-[10px] border border-border bg-card p-4">
      <p className="text-[12.5px] text-muted-foreground">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold text-foreground">
        {loading ? <span className="inline-block h-7 w-12 animate-pulse rounded bg-muted align-middle" /> : value}
      </p>
      {hint && (
        <p className={cn('mt-1 text-xs', hintTone ? toneClasses[hintTone].text : 'text-muted-foreground')}>{hint}</p>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
  className,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {children && <div className="mt-1.5 max-w-md text-[13px] leading-relaxed text-muted-foreground">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Segmented control (e.g. "7 days · This month · 90 days"). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg border border-border bg-muted/40 p-[3px]">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'h-7 rounded-md px-3 text-[13px] transition-colors',
              active
                ? 'bg-background font-semibold text-foreground shadow-[0_0_0_1px_hsl(var(--border))]'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Table styles shared by admin tables (plain <table>, hairline rows). */
export const tableStyles = {
  table: 'w-full border-collapse text-[13px]',
  headRow: 'text-left text-muted-foreground',
  th: 'px-[18px] py-2.5 text-xs font-medium',
  row: 'border-t border-border/70',
  td: 'px-[18px] py-3 align-middle',
};

/** Class names that turn shadcn <Tabs> into the admin's underline tabs. */
export const underlineTabs = {
  list: 'h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-border bg-transparent p-0 text-muted-foreground',
  trigger:
    '-mb-px h-9 shrink-0 rounded-none border-b-2 border-transparent bg-transparent px-3 text-[13.5px] font-normal text-muted-foreground shadow-none ' +
    'hover:text-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-none',
};
