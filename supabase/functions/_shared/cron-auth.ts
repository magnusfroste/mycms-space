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

  return isAdminToken(admin, token);
}

// True only for a signed-in admin user (JWT in Authorization header).
// Does not accept the cron secret or the service role key.
export async function isAdminRequest(req: Request): Promise<boolean> {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  return isAdminToken(admin, token);
}

// deno-lint-ignore no-explicit-any
async function isAdminToken(admin: any, token: string): Promise<boolean> {
  // OAuth access tokens (MCP connectors) carry a client_id claim. They only
  // work through the MCP server's scopes, never as an admin session.
  if (jwtClaims(token)?.client_id) return false;
  const { data: userData } = await admin.auth.getUser(token);
  if (!userData?.user) return false;
  const { data: adminRow } = await admin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  return Boolean(adminRow);
}

/** Decodes a JWT payload without verifying it (verify separately with getUser). */
export function jwtClaims(token: string): Record<string, unknown> | null {
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "=");
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}

export function forbidden(corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
