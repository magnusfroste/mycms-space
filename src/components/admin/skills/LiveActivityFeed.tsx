// ============================================
// Live Activity Feed
// Real-time agent activity with pulsing animations
// ============================================

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  Search, PenSquare, Mail, Zap, Radar, Globe,
  CheckCircle, AlertCircle, Clock, Loader2, Eye,
  Shield, Brain, MessageSquare, RefreshCw,
} from 'lucide-react';

interface LiveActivity {
  id: string;
  skill_name: string;
  status: string;
  agent: string;
  created_at: string;
  duration_ms: number | null;
  error_message: string | null;
  isNew?: boolean;
}

const skillIcons: Record<string, typeof Search> = {
  research_topic: Search,
  draft_blog_post: PenSquare,
  draft_newsletter: Mail,
  scout_sources: Radar,
  web_scrape: Globe,
  save_memory: Brain,
  get_site_stats: RefreshCw,
  send_newsletter: Mail,
  inbox_scan: Mail,
  signal_ingest: Zap,
  approve_task: Shield,
  chat: MessageSquare,
};

const statusStyles: Record<string, { color: string; icon: typeof Clock; pulse: boolean }> = {
  success:          { color: 'bg-emerald-500', icon: CheckCircle, pulse: false },
  failed:           { color: 'bg-destructive',  icon: AlertCircle, pulse: false },
  pending_approval: { color: 'bg-amber-500',    icon: Eye,         pulse: true },
  approved:         { color: 'bg-emerald-500',   icon: CheckCircle, pulse: false },
  rejected:         { color: 'bg-destructive',   icon: AlertCircle, pulse: false },
  running:          { color: 'bg-blue-500',      icon: Loader2,     pulse: true },
};

function ActivityDot({ status }: { status: string }) {
  const style = statusStyles[status] || statusStyles.success;
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      {style.pulse && (
        <span className={cn(
          "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
          style.color
        )} />
      )}
      <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", style.color)} />
    </span>
  );
}

function ActivityItem({ activity, isNew }: { activity: LiveActivity; isNew: boolean }) {
  const SkillIcon = skillIcons[activity.skill_name] || Zap;
  const style = statusStyles[activity.status] || statusStyles.success;
  const StatusIcon = style.icon;
  const displayName = activity.skill_name.replace(/_/g, ' ');

  return (
    <div className={cn(
      "flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-500",
      isNew && "animate-fade-in bg-primary/5 border border-primary/10",
      !isNew && "hover:bg-muted/50"
    )}>
      <ActivityDot status={activity.status} />
      <SkillIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium capitalize truncate">{displayName}</span>
          <StatusIcon className={cn(
            "h-3 w-3 shrink-0",
            activity.status === 'success' && "text-emerald-500",
            activity.status === 'failed' && "text-destructive",
            activity.status === 'pending_approval' && "text-amber-500",
            activity.status === 'running' && "text-blue-500 animate-spin",
          )} />
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</span>
          {activity.duration_ms !== null && (
            <span className="font-mono">{activity.duration_ms}ms</span>
          )}
          {activity.error_message && (
            <Badge variant="destructive" className="text-[9px] h-4 px-1">error</Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LiveActivityFeed() {
  const [realtimeItems, setRealtimeItems] = useState<LiveActivity[]>([]);
  const newIdsRef = useRef<Set<string>>(new Set());

  // Initial load
  const { data: initialActivities = [] } = useQuery({
    queryKey: ['live-activity-feed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_activity')
        .select('id, skill_name, status, agent, created_at, duration_ms, error_message')
        .order('created_at', { ascending: false })
        .limit(15);
      if (error) throw error;
      return (data || []) as LiveActivity[];
    },
    refetchInterval: 30_000,
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('live-activity-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'agent_activity' },
        (payload) => {
          const newItem = payload.new as LiveActivity;
          newItem.isNew = true;
          newIdsRef.current.add(newItem.id);
          setRealtimeItems(prev => [newItem, ...prev].slice(0, 10));
          
          // Clear "new" flag after animation
          setTimeout(() => {
            newIdsRef.current.delete(newItem.id);
          }, 3000);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Merge realtime with initial, deduplicate
  const allActivities = (() => {
    const seen = new Set<string>();
    const merged: LiveActivity[] = [];
    for (const item of [...realtimeItems, ...initialActivities]) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        merged.push(item);
      }
    }
    return merged.slice(0, 15);
  })();

  const hasRunning = allActivities.some(a => a.status === 'running' || a.status === 'pending_approval');

  return (
    <div className="space-y-1">
      {/* Live indicator */}
      <div className="flex items-center gap-2 px-3 pb-1">
        <span className="relative flex h-2 w-2">
          {hasRunning && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
          )}
          <span className={cn(
            "relative inline-flex rounded-full h-2 w-2",
            hasRunning ? "bg-emerald-500" : "bg-muted-foreground/40"
          )} />
        </span>
        <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
          {hasRunning ? 'Live' : 'Activity'}
        </span>
      </div>

      {/* Activity items */}
      {allActivities.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No recent activity</p>
      ) : (
        <div className="space-y-0.5">
          {allActivities.map(activity => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              isNew={newIdsRef.current.has(activity.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
