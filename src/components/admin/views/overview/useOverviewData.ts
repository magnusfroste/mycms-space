// ============================================
// Overview numbers, computed from the raw tables (admin RLS can read them all).
// ============================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Period = '7d' | 'month' | '90d';

export const periodLabels: Record<Period, { short: string; phrase: string; prior: string }> = {
  '7d': { short: '7 days', phrase: 'the last 7 days', prior: 'prior 7 days' },
  month: { short: 'This month', phrase: 'this month', prior: 'last month' },
  '90d': { short: '90 days', phrase: 'the last 90 days', prior: 'prior 90 days' },
};

const DAY = 86400_000;

/** [start, end) of the current period and of the one before it. */
export function periodRange(period: Period, now = new Date()) {
  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const priorStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return { start, priorStart, priorEnd: start };
  }
  const days = period === '7d' ? 7 : 90;
  const start = new Date(now.getTime() - days * DAY);
  const priorStart = new Date(now.getTime() - 2 * days * DAY);
  return { start, priorStart, priorEnd: start };
}

/** Reads every row of a filtered query, 1000 at a time (PostgREST caps a page at 1000). */
async function fetchAll<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  max = 50_000,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; from < max; from += 1000) {
    const { data, error } = await build(from, from + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

export interface OverviewData {
  inquiries: number;
  inquiriesPrior: number;
  visitors: number;
  visitorsPrior: number;
  chats: number;
  chatsPrior: number;
  topPages: { slug: string; views: number }[];
}

export function useOverviewData(period: Period) {
  return useQuery({
    queryKey: ['admin-overview', period],
    queryFn: async (): Promise<OverviewData> => {
      const { start, priorStart } = periodRange(period);
      const from = priorStart.toISOString();
      const startIso = start.toISOString();

      const [views, chats, contacts] = await Promise.all([
        fetchAll<{ visitor_id: string; page_slug: string; created_at: string }>((a, b) =>
          supabase.from('page_views').select('visitor_id, page_slug, created_at').gte('created_at', from).order('created_at').range(a, b),
        ),
        fetchAll<{ session_id: string; created_at: string }>((a, b) =>
          supabase.from('chat_messages').select('session_id, created_at').gte('created_at', from).order('created_at').range(a, b),
        ),
        fetchAll<{ created_at: string }>((a, b) =>
          supabase.from('contact_messages').select('created_at').gte('created_at', from).order('created_at').range(a, b),
        ),
      ]);

      const inCurrent = (iso: string) => iso >= startIso;
      const distinct = <T,>(rows: T[], key: (r: T) => string) => new Set(rows.map(key)).size;

      const viewsNow = views.filter((v) => inCurrent(v.created_at));
      const viewsPrior = views.filter((v) => !inCurrent(v.created_at));
      const chatsNow = chats.filter((c) => inCurrent(c.created_at));
      const chatsPrior = chats.filter((c) => !inCurrent(c.created_at));

      const pageCounts: Record<string, number> = {};
      for (const v of viewsNow) pageCounts[v.page_slug] = (pageCounts[v.page_slug] ?? 0) + 1;
      const topPages = Object.entries(pageCounts)
        .map(([slug, count]) => ({ slug, views: count }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 6);

      return {
        inquiries: contacts.filter((c) => inCurrent(c.created_at)).length,
        inquiriesPrior: contacts.filter((c) => !inCurrent(c.created_at)).length,
        visitors: distinct(viewsNow, (v) => v.visitor_id),
        visitorsPrior: distinct(viewsPrior, (v) => v.visitor_id),
        chats: distinct(chatsNow, (c) => c.session_id),
        chatsPrior: distinct(chatsPrior, (c) => c.session_id),
        topPages,
      };
    },
    staleTime: 60_000,
  });
}

/** Numbers that do not depend on the period switch. */
export function useOverviewStatus() {
  return useQuery({
    queryKey: ['admin-overview', 'status'],
    queryFn: async () => {
      const head = { count: 'exact' as const, head: true };
      const [published, drafts, lastPost, subs, pending, unread, kbLatest, kbCount, notFound] = await Promise.all([
        supabase.from('blog_posts').select('id', head).eq('status', 'published'),
        supabase.from('blog_posts').select('id', head).eq('status', 'draft'),
        supabase
          .from('blog_posts')
          .select('published_at')
          .eq('status', 'published')
          .order('published_at', { ascending: false, nullsFirst: false })
          .limit(1)
          .maybeSingle(),
        supabase.from('newsletter_subscribers').select('id', head).eq('status', 'active'),
        supabase.from('newsletter_subscribers').select('id', head).eq('status', 'pending'),
        supabase.from('contact_messages').select('id', head).eq('is_read', false),
        supabase.from('knowledge_docs').select('updated_at').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('knowledge_docs').select('id', head),
        supabase
          .from('page_views')
          .select('id', head)
          .eq('page_slug', '404')
          .gte('created_at', new Date(Date.now() - 7 * DAY).toISOString()),
      ]);
      return {
        published: published.count ?? 0,
        drafts: drafts.count ?? 0,
        lastPublishedAt: (lastPost.data?.published_at as string | null) ?? null,
        subscribers: subs.count ?? 0,
        pendingSubscribers: pending.count ?? 0,
        unread: unread.count ?? 0,
        knowledgeUpdatedAt: (kbLatest.data?.updated_at as string | null) ?? null,
        knowledgeDocs: kbCount.count ?? 0,
        notFound7d: notFound.count ?? 0,
      };
    },
    staleTime: 60_000,
  });
}
