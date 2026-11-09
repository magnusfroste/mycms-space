import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AdminPageHeaderProps {
  title: string;
  /** One sentence: what this page is for. */
  description?: ReactNode;
  /** Buttons or controls aligned to the right. */
  actions?: ReactNode;
  className?: string;
}

/** Consistent page header used by every admin view. */
export function AdminPageHeader({ title, description, actions, className }: AdminPageHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-[-0.01em] text-foreground">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-[720px] text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export default AdminPageHeader;
