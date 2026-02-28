// ============================================
// Agent Inbox Scan Edge Function
// Reads Gmail, extracts signals with AI, saves to agent_tasks
// ============================================

import { createClient } from "npm:@supabase/supabase-js@2";
import { callOpenAICompatible, resolveProvider } from "../_shared/ai-agent.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// ============================================
// Token Management
// ============================================

interface GmailConfig {
  connected: boolean;
  email: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  filter_senders: string[];
  filter_labels: string[];
  max_messages: number;
  scan_days: number;
}

async function getValidToken(supabase: ReturnType<typeof getSupabase>): Promise<{ token: string; config: GmailConfig }> {
  const { data } = await supabase
    .from('modules')
    .select('id, module_config')
    .eq('module_type', 'gmail_signals')
    .eq('enabled', true)
    .maybeSingle();

  if (!data) throw new Error('Gmail not connected');

  const config = data.module_config as unknown as GmailConfig;
  if (!config.connected || !config.refresh_token) throw new Error('Gmail not connected');

  // Check if token is expired (with 5 min buffer)
  if (Date.now() > config.expires_at - 300000) {
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    if (!clientId || !clientSecret) throw new Error('Google OAuth not configured');

    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: config.refresh_token,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      }),
    });

    const tokens = await res.json();
    if (!res.ok) throw new Error(`Token refresh failed: ${tokens.error}`);

    config.access_token = tokens.access_token;
    config.expires_at = Date.now() + (tokens.expires_in * 1000);

    await supabase.from('modules')
      .update({ module_config: config as any })
      .eq('id', data.id);
  }

  return { token: config.access_token, config };
}

// ============================================
// Gmail API
// ============================================

interface EmailSignal {
  from: string;
  subject: string;
  snippet: string;
  date: string;
  labels: string[];
}

async function fetchRecentEmails(token: string, config: GmailConfig): Promise<EmailSignal[]> {
  const daysAgo = new Date(Date.now() - config.scan_days * 24 * 60 * 60 * 1000);
  const afterDate = `${daysAgo.getFullYear()}/${daysAgo.getMonth() + 1}/${daysAgo.getDate()}`;

  // Build query for specific senders
  let query = `after:${afterDate}`;
  if (config.filter_senders.length > 0) {
    const fromQuery = config.filter_senders.map(s => `from:${s}`).join(' OR ');
    query += ` (${fromQuery})`;
  }

  const listRes = await fetch(
    `${GMAIL_API}/messages?maxResults=${config.max_messages}&q=${encodeURIComponent(query)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!listRes.ok) {
    const err = await listRes.text();
    throw new Error(`Gmail list failed [${listRes.status}]: ${err}`);
  }

  const listData = await listRes.json();
  const messages = listData.messages || [];

  const signals: EmailSignal[] = [];

  // Fetch each message (metadata only for privacy)
  for (const msg of messages.slice(0, config.max_messages)) {
    try {
      const msgRes = await fetch(
        `${GMAIL_API}/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!msgRes.ok) continue;
      const msgData = await msgRes.json();

      const headers = msgData.payload?.headers || [];
      const getHeader = (name: string) => headers.find((h: any) => h.name === name)?.value || '';

      signals.push({
        from: getHeader('From'),
        subject: getHeader('Subject'),
        snippet: msgData.snippet || '',
        date: getHeader('Date'),
        labels: msgData.labelIds || [],
      });
    } catch (e) {
      console.error(`[InboxScan] Failed to fetch message ${msg.id}:`, e);
    }
  }

  return signals;
}

// ============================================
// AI Signal Analysis
// ============================================

async function analyzeSignals(signals: EmailSignal[], email: string): Promise<string> {
  if (signals.length === 0) return 'No new signals found in the inbox.';

  const signalText = signals.map(s =>
    `From: ${s.from}\nSubject: ${s.subject}\nSnippet: ${s.snippet}\nDate: ${s.date}`
  ).join('\n\n---\n\n');

  const config = { provider: 'lovable' as const };
  const { url, apiKey, model } = resolveProvider(config);

  const data = await callOpenAICompatible({
    url,
    apiKey,
    model,
    messages: [
      {
        role: 'system',
        content: `You are analyzing email signals for ${email}'s professional network activity. Extract:

1. **Network Activity** - Who reached out, connection requests, endorsements
2. **Content Trends** - Topics trending in newsletters and LinkedIn notifications  
3. **Opportunities** - Speaking invites, collaboration requests, job-related signals
4. **Key Topics** - Recurring themes that could inspire blog posts
5. **Suggested Actions** - What to respond to, what to write about

Be concise and actionable. Focus on professional signals, ignore promotional/marketing emails.
If this is LinkedIn data, extract names, companies, and context.`,
      },
      {
        role: 'user',
        content: `Analyze these ${signals.length} email signals:\n\n${signalText}`,
      },
    ],
  });

  return data.choices?.[0]?.message?.content || 'Analysis failed';
}

// ============================================
// Main Handler
// ============================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getSupabase();
    const body = req.method === 'POST' ? await req.json() : {};
    const action = body.action || 'scan';

    if (action === 'scan') {
      // Create task
      const taskId = crypto.randomUUID();
      await supabase.from('agent_tasks').insert({
        id: taskId,
        task_type: 'inbox_digest',
        status: 'running',
        input_data: { source: 'gmail' },
      });

      try {
        const { token, config } = await getValidToken(supabase);
        const signals = await fetchRecentEmails(token, config);
        const analysis = await analyzeSignals(signals, config.email);

        // Extract topics for potential blog drafts
        const topicsPrompt = await callOpenAICompatible({
          ...resolveProvider({ provider: 'lovable' as const }),
          messages: [
            {
              role: 'system',
              content: 'Extract 2-3 blog post topics from this analysis. Return as JSON array of strings. Only the array, nothing else.',
            },
            { role: 'user', content: analysis },
          ],
        });

        let suggestedTopics: string[] = [];
        try {
          const topicsText = topicsPrompt.choices?.[0]?.message?.content || '[]';
          suggestedTopics = JSON.parse(topicsText.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
        } catch { /* ignore parse errors */ }

        await supabase.from('agent_tasks').update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          output_data: {
            analysis,
            signal_count: signals.length,
            suggested_topics: suggestedTopics,
            email: config.email,
            scan_period_days: config.scan_days,
          },
        }).eq('id', taskId);

        return new Response(
          JSON.stringify({ success: true, taskId, signalCount: signals.length, analysis, suggestedTopics }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (e) {
        await supabase.from('agent_tasks').update({
          status: 'failed',
          output_data: { error: e instanceof Error ? e.message : 'Unknown error' },
        }).eq('id', taskId);
        throw e;
      }
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[InboxScan] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
