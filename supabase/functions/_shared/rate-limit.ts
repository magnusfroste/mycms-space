import { createClient } from "npm:@supabase/supabase-js@2";

// Simple fixed-window rate limit backed by public.rate_limits via the
// SECURITY DEFINER function hit_rate_limit (service role only).
// Fails open: if the database call errors, the request is allowed.

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || req.headers.get("x-real-ip") || "unknown";
}

export async function isRateLimited(
  key: string,
  windowSeconds: number,
  max: number,
): Promise<boolean> {
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data, error } = await admin.rpc("hit_rate_limit", {
      p_key: key,
      p_window_seconds: windowSeconds,
      p_max: max,
    });
    if (error) {
      console.warn("[rate-limit] check failed, allowing request:", error.message);
      return false;
    }
    // hit_rate_limit returns true while the caller is within the limit.
    return data === false;
  } catch (e) {
    console.warn("[rate-limit] check failed, allowing request:", e);
    return false;
  }
}

export function tooManyRequests(corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: "Too many requests" }), {
    status: 429,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
