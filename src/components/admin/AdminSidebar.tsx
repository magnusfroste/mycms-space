// ============================================
// Admin sidebar — grouped navigation (see docs/redesign/AdminNav.dc.html)
// Desktop: a sticky column under the top bar. Mobile: the shadcn sheet.
// ============================================

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Sidebar, SidebarContent, SidebarFooter, useSidebar } from '@/components/ui/sidebar';
import { useAllModules } from '@/models/modules';
import { getHiddenSidebarItems } from '@/lib/constants/moduleRegistry';
import { cn } from '@/lib/utils';
import { adminNavGroups, MCP_ENDPOINT, type AdminViewId } from './shell/nav';
import { adminHref } from './shell/primitives';
import { useReviewCount } from './review/reviewData';

interface AdminSidebarProps {
  activeView: AdminViewId;
}

function useUnreadInboxCount() {
  return useQuery({
    queryKey: ['contact-messages', 'unread-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('contact_messages')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false);
      return count ?? 0;
    },
    refetchInterval: 120_000,
  });
}

function SidebarNav({ activeView }: AdminSidebarProps) {
  const { data: allModules = [] } = useAllModules();
  const { data: reviewCount = 0 } = useReviewCount();
  const { data: unread = 0 } = useUnreadInboxCount();
  const { isMobile, setOpenMobile } = useSidebar();
  const [copied, setCopied] = useState(false);

  const hidden = useMemo(
    () => getHiddenSidebarItems(allModules as Array<{ module_type: string; enabled: boolean | null }>),
    [allModules],
  );

  const badges: Partial<Record<AdminViewId, { value: number; tone: 'alert' | 'neutral' }>> = {
    review: reviewCount > 0 ? { value: reviewCount, tone: 'alert' } : undefined,
    inbox: unread > 0 ? { value: unread, tone: 'neutral' } : undefined,
  };

  const copyEndpoint = async () => {
    try {
      await navigator.clipboard.writeText(MCP_ENDPOINT);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard can be blocked; the endpoint is visible anyway */
    }
  };

  const shortEndpoint = MCP_ENDPOINT.replace(/^https?:\/\/[^.]+\./, '…');

  return (
    <>
      <SidebarContent className="gap-5 px-3 py-4">
        {adminNavGroups.map((group) => {
          const items = group.items.filter((i) => !hidden.has(i.id));
          if (items.length === 0) return null;
          return (
            <div key={group.label || 'top'} className="flex flex-col gap-0.5">
              {group.label && (
                <p className="mb-1.5 ml-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  {group.label}
                </p>
              )}
              {items.map((item) => {
                const active = item.id === activeView;
                const badge = badges[item.id];
                return (
                  <Link
                    key={item.id}
                    to={adminHref(item.id)}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => isMobile && setOpenMobile(false)}
                    className={cn(
                      'flex h-8 items-center justify-between rounded-md px-2.5 text-[13.5px] transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      active
                        ? 'bg-background font-semibold text-foreground shadow-[0_0_0_1px_hsl(var(--border)),0_1px_2px_hsl(var(--foreground)/0.04)]'
                        : 'font-medium text-sidebar-foreground hover:bg-background/70 hover:text-foreground',
                    )}
                  >
                    <span className="truncate">{item.label}</span>
                    {badge && (
                      <span
                        className={cn(
                          'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 font-mono text-[11px] font-medium',
                          badge.tone === 'alert' ? 'bg-warning-soft text-warning' : 'bg-muted text-foreground/80',
                        )}
                      >
                        {badge.value > 999 ? '999+' : badge.value}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </SidebarContent>
      <SidebarFooter className="px-3 pb-5 pt-0">
        <div className="flex flex-col gap-2 border-t border-border px-2.5 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">MCP endpoint</p>
          <code className="break-all font-mono text-[11px] text-sidebar-foreground" title={MCP_ENDPOINT}>
            {shortEndpoint}
          </code>
          <button
            type="button"
            onClick={copyEndpoint}
            className="inline-flex items-center gap-1.5 self-start text-[13px] font-medium text-ring hover:underline underline-offset-2"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy for your agent'}
          </button>
        </div>
      </SidebarFooter>
    </>
  );
}

export function AdminSidebar({ activeView }: AdminSidebarProps) {
  const { isMobile } = useSidebar();

  if (isMobile) {
    return (
      <Sidebar collapsible="offcanvas">
        <SidebarNav activeView={activeView} />
      </Sidebar>
    );
  }

  return (
    <div className="w-[232px] shrink-0 border-r border-sidebar-border bg-sidebar">
      <Sidebar collapsible="none" className="sticky top-[52px] h-[calc(100svh-52px)] w-full">
        <SidebarNav activeView={activeView} />
      </Sidebar>
    </div>
  );
}

export default AdminSidebar;
