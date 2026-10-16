import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Scheduled/agent functions may only be triggered by pg_cron (x-cron-secret),
// other edge functions (service role key) or a signed-in admin.
export async function isTrustedCaller(req: Request): Promise<boolean> {
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey);

  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret) {
    const { data } = await admin.rpc("is_valid_cron_secret", { p_secret: cronSecret });
    if (data === true) return true;
  }

  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return false;
  if (token === serviceKey) return true;

  const { data: userData } = await admin.auth.getUser(token);
  if (!userData.user) return false;
  const { data: adminRow } = await admin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  return Boolean(adminRow);
}

export function forbidden(corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
