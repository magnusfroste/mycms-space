// ============================================
// Notify Admin — Pending Approval Email
// Sends email via Resend when a skill needs approval
// ============================================

export async function notifyPendingApproval(skillName: string, reason?: string): Promise<void> {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!resendKey) {
    console.log('[notify] No RESEND_API_KEY configured, skipping email notification');
    return;
  }

  // Admin email — read from env or fallback
  const adminEmail = Deno.env.get('ADMIN_EMAIL');
  if (!adminEmail) {
    console.log('[notify] No ADMIN_EMAIL configured, skipping email notification');
    return;
  }

  const fromEmail = Deno.env.get('FROM_EMAIL') || 'notifications@updates.lovable.app';
  const appUrl = Deno.env.get('APP_URL') || 'https://mycms-chat.lovable.app';

  const displayName = skillName.replace(/_/g, ' ');

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [adminEmail],
        subject: `⏳ Approval needed: ${displayName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="margin: 0 0 12px; font-size: 18px;">Pending Approval</h2>
            <p style="margin: 0 0 8px; color: #555;">
              The skill <strong>${displayName}</strong> requires your approval before it can execute.
            </p>
            ${reason ? `<p style="margin: 0 0 16px; color: #777; font-size: 14px;">${reason}</p>` : ''}
            <a href="${appUrl}/admin?tab=agency"
               style="display: inline-block; padding: 10px 20px; background: #111; color: #fff; border-radius: 6px; text-decoration: none; font-size: 14px;">
              Review in Agency
            </a>
            <p style="margin: 16px 0 0; font-size: 12px; color: #999;">
              Sent by Magnet Agent
            </p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('[notify] Resend error:', res.status, body);
    } else {
      await res.json();
      console.log('[notify] Approval email sent for:', skillName);
    }
  } catch (err) {
    console.error('[notify] Failed to send approval email:', err);
  }
}
