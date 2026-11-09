// ============================================
// MCP server details — endpoint, client config and the skills exposed as tools.
// Keys are managed in the Operators table; calls are in the Activity log.
// ============================================

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { MCP_ENDPOINT } from '@/components/admin/shell/nav';
import { AdminLink, Chip, Eyebrow, Panel } from '@/components/admin/shell/primitives';
import { mcpClientConfig } from '@/components/admin/agents/agentsData';

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-7 gap-1.5 px-2 text-xs"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* clipboard blocked */
        }
      }}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : label}
    </Button>
  );
}

export default function McpPanel() {
  const { data: exposedSkills = [] } = useQuery({
    queryKey: ['mcp-exposed-skills'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_skills')
        .select('name, description, category, scope')
        .eq('enabled', true)
        .in('scope', ['public', 'both', 'external'])
        .order('category');
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <Panel
        title="MCP server"
        description="Streamable HTTP, protocol 2024-11-05. Without a key only public tools are listed; with a key the CMS tools appear according to its scopes."
      >
        <div className="space-y-4 px-[18px] py-4">
          <div className="space-y-1.5">
            <Eyebrow>Endpoint</Eyebrow>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 break-all rounded-md bg-muted px-3 py-2 font-mono text-xs">{MCP_ENDPOINT}</code>
              <CopyButton text={MCP_ENDPOINT} />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Eyebrow>Client config (Claude Desktop, Cursor, Hermes …)</Eyebrow>
              <CopyButton text={mcpClientConfig()} />
            </div>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">{mcpClientConfig()}</pre>
          </div>
          <p className="text-[12.5px] text-muted-foreground">
            Every call is logged in the <AdminLink view="activity" section="operators" className="text-[12.5px]">Activity log</AdminLink>.
          </p>
        </div>
      </Panel>

      <Panel
        title={`Skills exposed as tools · ${exposedSkills.length}`}
        description="Enabled skills with scope public, both or external are offered to operators with the content scope, next to the built-in CMS tools."
      >
        {exposedSkills.length === 0 ? (
          <p className="px-[18px] py-6 text-[13px] text-muted-foreground">No skills are exposed. Set a skill's scope to external or both in the Skills tab.</p>
        ) : (
          <div className="grid gap-2 p-4 sm:grid-cols-2">
            {exposedSkills.map((s) => (
              <div key={s.name} className="space-y-1 rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <code className="truncate font-mono text-xs font-semibold">{s.name}</code>
                  <Chip>{s.scope}</Chip>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
