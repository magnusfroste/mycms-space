// ============================================
// Agent Daily Report — Self-Reporting via Email
// Sends a summary of Magnet's last 24h activity
// ============================================

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ActivityRow {
  skill_name: string;
  status: string;
  created_at: string;
  duration_ms: number | null;
  error_message: string | null;
  output: Record<string, unknown> | null;
}

interface ObjectiveRow {
  goal: string;
  status: string;
  progress: Record<string, unknown> | null;
  constraints: Record<string, unknown> | null;
  updated_at: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!RESEND_API_KEY || !ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: 'Missing RESEND_API_KEY or ADMIN_EMAIL' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Fetch recent activity
    const { data: activities } = await supabase
      .from('agent_activity')
      .select('skill_name, status, created_at, duration_ms, error_message, output')
      .gte('created_at', since)
      .order('created_at', { ascending: true });

    // Fetch active objectives
    const { data: objectives } = await supabase
      .from('agent_objectives')
      .select('goal, status, progress, constraints, updated_at')
      .in('status', ['active', 'completed'])
      .gte('updated_at', since);

    // Fetch new tasks/signals
    const { data: tasks } = await supabase
      .from('agent_tasks')
      .select('task_type, status, created_at')
      .gte('created_at', since);

    const acts = (activities || []) as ActivityRow[];
    const objs = (objectives || []) as ObjectiveRow[];
    const tks = tasks || [];

    // Stats
    const totalActions = acts.length;
    const successes = acts.filter(a => a.status === 'success').length;
    const failures = acts.filter(a => a.status === 'failed').length;
    const approvals = acts.filter(a => a.status === 'pending_approval').length;
    const avgDuration = totalActions > 0
      ? Math.round(acts.reduce((s, a) => s + (a.duration_ms || 0), 0) / totalActions)
      : 0;

    // Skill breakdown
    const skillCounts: Record<string, { success: number; failed: number }> = {};
    for (const a of acts) {
      const name = a.skill_name.replace(/_/g, ' ');
      if (!skillCounts[name]) skillCounts[name] = { success: 0, failed: 0 };
      if (a.status === 'success') skillCounts[name].success++;
      else if (a.status === 'failed') skillCounts[name].failed++;
    }

    // Build HTML email
    const appUrl = Deno.env.get('APP_URL') || 'https://mycms-chat.lovable.app';
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const skillRows = Object.entries(skillCounts)
      .sort(([, a], [, b]) => (b.success + b.failed) - (a.success + a.failed))
      .map(([name, counts]) => `
        <tr>
          <td style="padding:6px 12px;border-bottom:1px solid #eee;font-size:13px;">${name}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:center;color:#16a34a;">${counts.success}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:center;color:#dc2626;">${counts.failed}</td>
        </tr>
      `).join('');

    const objectiveRows = objs.map(o => {
      const plan = (o.progress as any)?.plan;
      const steps = plan?.steps || [];
      const done = steps.filter((s: any) => s.status === 'done').length;
      const pct = steps.length > 0 ? Math.round((done / steps.length) * 100) : 0;
      const priority = (o.constraints as any)?.priority || '';
      return `
        <tr>
          <td style="padding:6px 12px;border-bottom:1px solid #eee;font-size:13px;">${o.goal}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:center;">${priority || '—'}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:center;">${pct}%</td>
          <td style="padding:6px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:center;">${o.status}</td>
        </tr>
      `;
    }).join('');

    const signalCount = tks.filter(t => t.task_type === 'signal').length;
    const blogDrafts = tks.filter(t => t.task_type === 'blog_draft').length;

    const failedActs = acts.filter(a => a.status === 'failed');
    const errorSection = failedActs.length > 0
      ? `<div style="margin-top:20px;padding:12px;background:#fef2f2;border-radius:8px;border:1px solid #fecaca;">
           <strong style="color:#dc2626;font-size:13px;">⚠ Errors (${failedActs.length})</strong>
           <ul style="margin:8px 0 0;padding-left:18px;">
             ${failedActs.slice(0, 5).map(a => `<li style="font-size:12px;color:#555;margin:4px 0;">${a.skill_name.replace(/_/g, ' ')}: ${a.error_message || 'Unknown error'}</li>`).join('')}
           </ul>
         </div>`
      : '';

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff;">
        <h1 style="margin:0 0 4px;font-size:20px;font-weight:700;">🤖 Magnet Daily Report</h1>
        <p style="margin:0 0 20px;font-size:13px;color:#888;">${dateStr}</p>

        <!-- Stats Grid -->
        <div style="display:flex;gap:8px;margin-bottom:20px;">
          <div style="flex:1;background:#f8f9fa;border-radius:8px;padding:12px;text-align:center;">
            <div style="font-size:22px;font-weight:700;">${totalActions}</div>
            <div style="font-size:11px;color:#888;">Actions</div>
          </div>
          <div style="flex:1;background:#f0fdf4;border-radius:8px;padding:12px;text-align:center;">
            <div style="font-size:22px;font-weight:700;color:#16a34a;">${successes}</div>
            <div style="font-size:11px;color:#888;">Success</div>
          </div>
          <div style="flex:1;background:#fef2f2;border-radius:8px;padding:12px;text-align:center;">
            <div style="font-size:22px;font-weight:700;color:#dc2626;">${failures}</div>
            <div style="font-size:11px;color:#888;">Failed</div>
          </div>
          <div style="flex:1;background:#fffbeb;border-radius:8px;padding:12px;text-align:center;">
            <div style="font-size:22px;font-weight:700;color:#d97706;">${approvals}</div>
            <div style="font-size:11px;color:#888;">Pending</div>
          </div>
        </div>

        <!-- Signals & Drafts -->
        <p style="font-size:13px;color:#555;margin:0 0 16px;">
          📡 <strong>${signalCount}</strong> signals processed &nbsp;·&nbsp;
          📝 <strong>${blogDrafts}</strong> blog drafts &nbsp;·&nbsp;
          ⏱ Avg ${avgDuration}ms per action
        </p>

        <!-- Skill Breakdown -->
        ${Object.keys(skillCounts).length > 0 ? `
        <h3 style="margin:0 0 8px;font-size:14px;font-weight:600;">Skill Breakdown</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          <thead>
            <tr style="background:#f8f9fa;">
              <th style="padding:6px 12px;text-align:left;font-size:11px;color:#888;font-weight:600;">Skill</th>
              <th style="padding:6px 12px;text-align:center;font-size:11px;color:#888;font-weight:600;">✓</th>
              <th style="padding:6px 12px;text-align:center;font-size:11px;color:#888;font-weight:600;">✗</th>
            </tr>
          </thead>
          <tbody>${skillRows}</tbody>
        </table>
        ` : ''}

        <!-- Objectives -->
        ${objs.length > 0 ? `
        <h3 style="margin:0 0 8px;font-size:14px;font-weight:600;">Objectives</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          <thead>
            <tr style="background:#f8f9fa;">
              <th style="padding:6px 12px;text-align:left;font-size:11px;color:#888;font-weight:600;">Goal</th>
              <th style="padding:6px 12px;text-align:center;font-size:11px;color:#888;font-weight:600;">Priority</th>
              <th style="padding:6px 12px;text-align:center;font-size:11px;color:#888;font-weight:600;">Progress</th>
              <th style="padding:6px 12px;text-align:center;font-size:11px;color:#888;font-weight:600;">Status</th>
            </tr>
          </thead>
          <tbody>${objectiveRows}</tbody>
        </table>
        ` : ''}

        ${errorSection}

        <!-- CTA -->
        <div style="margin-top:24px;text-align:center;">
          <a href="${appUrl}/admin?tab=autopilot"
             style="display:inline-block;padding:10px 24px;background:#111;color:#fff;border-radius:6px;text-decoration:none;font-size:13px;font-weight:500;">
            Open Autopilot Dashboard
          </a>
        </div>

        <p style="margin:24px 0 0;font-size:11px;color:#bbb;text-align:center;">
          Sent by Magnet · ${now.toISOString().slice(0, 16)} UTC
        </p>
      </div>
    `;

    // Send via Resend
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'notifications@updates.lovable.app';

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `Magnet Agent <${fromEmail}>`,
        to: [ADMIN_EMAIL],
        subject: `🤖 Daily Report — ${successes} actions, ${failures} errors`,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('[daily-report] Resend error:', res.status, body);
      return new Response(JSON.stringify({ error: 'Email send failed', detail: body }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const result = await res.json();
    console.log('[daily-report] Sent successfully:', result);

    // Log activity
    await supabase.from('agent_activity').insert({
      agent: 'magnet',
      skill_name: 'daily_report',
      status: 'success',
      input: { since },
      output: { totalActions, successes, failures, objectives: objs.length },
    });

    return new Response(JSON.stringify({
      success: true,
      stats: { totalActions, successes, failures, approvals, objectives: objs.length },
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (err) {
    console.error('[daily-report] Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
