// ============================================
// Agent Status Block
// Subtle, public-facing display of recent agent activity
// Doubles as a discrete promotion of ClawCMS
// ============================================

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Orbit, Zap, PenLine, Search, MailCheck, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentActivity {
  id: string;
  skill_name: string;
  status: string;
  created_at: string;
}

const SKILL_ICONS: Record<string, React.ReactNode> = {
  'write-blog-post': <PenLine className="h-3 w-3" />,
  'research-topic': <Search className="h-3 w-3" />,
  'send-newsletter': <MailCheck className="h-3 w-3" />,
  'sync-github': <RefreshCw className="h-3 w-3" />,
};

const SKILL_LABELS: Record<string, string> = {
  'write-blog-post': 'Published content',
  'research-topic': 'Researched a topic',
  'send-newsletter': 'Sent newsletter',
  'sync-github': 'Synced repos',
  'heartbeat': 'System check',
  'reflect': 'Self-analysis',
  'advance-objective': 'Advanced a goal',
};

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface AgentStatusBlockConfig {
  agent_name?: string;
  tagline?: string;
  show_cta?: boolean;
  cta_text?: string;
  cta_url?: string;
  max_items?: number;
}

const AgentStatusBlock = ({ config }: { config: Record<string, unknown> }) => {
  const {
    agent_name = 'Magnet',
    tagline = 'Autonomous AI agent — always working',
    show_cta = true,
    cta_text = 'Powered by ClawCMS',
    cta_url = 'https://mycms.chat',
    max_items = 3,
  } = (config || {}) as AgentStatusBlockConfig;

  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    // Fetch recent successful activities
    const fetchActivities = async () => {
      const { data } = await supabase
        .from('agent_activity')
        .select('id, skill_name, status, created_at')
        .eq('status', 'success')
        .order('created_at', { ascending: false })
        .limit(max_items as number);

      if (data && data.length > 0) {
        setActivities(data);
        // Consider "live" if last activity was within 2 hours
        const lastTime = new Date(data[0].created_at).getTime();
        setIsLive(Date.now() - lastTime < 2 * 60 * 60 * 1000);
      }
    };

    fetchActivities();

    // Realtime subscription for new activities
    const channel = supabase
      .channel('public-agent-status')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'agent_activity' },
        (payload) => {
          const item = payload.new as AgentActivity;
          if (item.status === 'success') {
            setActivities((prev) => [item, ...prev].slice(0, max_items as number));
            setIsLive(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [max_items]);

  if (activities.length === 0) return null;

  return (
    <section className="py-8 sm:py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="relative">
              <Orbit className="h-4 w-4 text-primary" />
              {isLive && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              )}
            </div>
            <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
              {agent_name} · {isLive ? 'Active' : 'Recent'}
            </span>
          </div>

          {/* Activity items */}
          <div className="flex flex-col items-center gap-2">
            {activities.map((activity, i) => (
              <div
                key={activity.id}
                className={cn(
                  'flex items-center gap-2 text-sm text-muted-foreground/80 transition-opacity',
                  i === 0 ? 'opacity-100' : 'opacity-60'
                )}
              >
                <span className="text-primary/60">
                  {SKILL_ICONS[activity.skill_name] || <Zap className="h-3 w-3" />}
                </span>
                <span>
                  {SKILL_LABELS[activity.skill_name] || activity.skill_name}
                </span>
                <span className="text-xs text-muted-foreground/50">
                  {timeAgo(activity.created_at)}
                </span>
              </div>
            ))}
          </div>

          {/* Subtle tagline */}
          <p className="text-center text-xs text-muted-foreground/40 mt-4">
            {tagline}
          </p>

          {/* CTA / Branding */}
          {show_cta && (
            <div className="text-center mt-2">
              <a
                href={cta_url as string}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
              >
                <Orbit className="h-2.5 w-2.5" />
                {cta_text}
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AgentStatusBlock;
