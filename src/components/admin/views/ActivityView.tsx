import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { SettingsHistory } from '@/components/admin/SettingsHistory';
import { ActivityTable } from '@/components/admin/skills/ActivityTable';
import { AdminPageHeader } from '@/components/admin/shell/AdminPageHeader';
import { SectionTabs } from '@/components/admin/shell/SectionTabs';
import { EmptyState, Panel, StatusPill, tableStyles as t } from '@/components/admin/shell/primitives';

type McpActivity = {
  id: string;
  key_name: string | null;
  method: string;
  tool_name: string | null;
  status: string;
  duration_ms: number | null;
  error_message: string | null;
  created_at: string;
};

function OperatorActivity() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['mcp-activities', 'log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mcp_activities')
        .select('id, key_name, method, tool_name, status, duration_ms, error_message, created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as McpActivity[];
    },
    refetchInterval: 30_000,
  });

  return (
    <Panel
      title="Operator calls"
      description="Every request an external agent made through MCP, newest first (last 200)."
    >
      {isLoading ? (
        <p className="px-[18px] py-8 text-center text-[13px] text-muted-foreground">Loading…</p>
      ) : data.length === 0 ? (
        <EmptyState title="No operator calls yet">
          When an agent such as Hermes or Claude connects with an MCP key, each call shows up here.
        </EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className={t.table}>
            <thead>
              <tr className={t.headRow}>
                <th className={t.th}>When</th>
                <th className={t.th}>Operator</th>
                <th className={t.th}>Call</th>
                <th className={t.th}>Result</th>
                <th className={`${t.th} text-right`}>Duration</th>
              </tr>
            </thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.id} className={t.row}>
                  <td className={`${t.td} whitespace-nowrap text-foreground/80`} title={format(new Date(a.created_at), 'PPpp')}>
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                  </td>
                  <td className={`${t.td} font-medium`}>{a.key_name || '—'}</td>
                  <td className={`${t.td} font-mono text-xs`}>{a.tool_name || a.method}</td>
                  <td className={t.td}>
                    {a.status === 'success' ? (
                      <StatusPill tone="success">OK</StatusPill>
                    ) : (
                      <span title={a.error_message ?? undefined}>
                        <StatusPill tone="danger">{a.status}</StatusPill>
                      </span>
                    )}
                  </td>
                  <td className={`${t.td} text-right font-mono text-xs text-muted-foreground`}>
                    {a.duration_ms != null ? `${a.duration_ms} ms` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

export default function ActivityView({ section }: { section?: string }) {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Activity log"
        description="Every change to the site, whether you, an operator or Autopilot made it. Content changes can be restored."
      />
      <SectionTabs
        section={section}
        tabs={[
          { value: 'changes', label: 'Content changes', content: <SettingsHistory /> },
          { value: 'operators', label: 'Operators (MCP)', content: <OperatorActivity /> },
          { value: 'autopilot', label: 'Autopilot', content: <ActivityTable /> },
        ]}
      />
    </div>
  );
}
