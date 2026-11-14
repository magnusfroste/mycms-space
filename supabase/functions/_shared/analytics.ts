// Pure helpers for traffic numbers (no Deno imports; unit-tested).

/** PostgREST returns at most 1000 rows per request; page through to get them all. */
export async function fetchRows<T = any>(
  query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>,
  max = 100_000,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; from < max; from += 1000) {
    const { data, error } = await query(from, from + 999);
    if (error) throw new Error(error.message || String(error));
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

const NAMED: Record<string, number> = { week: 7, month: 30, quarter: 90, year: 365 };

/**
 * Period → start time. Accepts today, week, month, quarter, year, 7d, 30d,
 * last_7_days, last_30_days, or a number of days. Unknown values fall back to
 * 7 days, and the label always says which period was used.
 */
export function periodDays(period: unknown, days?: unknown, now = new Date()): { label: string; since: Date } {
  const back = (d: number) => {
    const n = Math.min(Math.max(Math.round(d), 1), 365);
    return { label: `last_${n}_days`, since: new Date(now.getTime() - n * 86_400_000) };
  };
  const n = Number(days);
  if (days !== undefined && days !== null && days !== "" && Number.isFinite(n) && n > 0) return back(n);
  const p = String(period ?? "week").toLowerCase().trim();
  if (p === "today") {
    const d = new Date(now);
    d.setUTCHours(0, 0, 0, 0);
    return { label: "today", since: d };
  }
  const digits = p.match(/(\d+)/);
  if (digits) return back(Number(digits[1]));
  for (const [name, d] of Object.entries(NAMED)) if (p.startsWith(name) || p.endsWith(name)) return back(d);
  return back(7);
}

export const isNotFoundSlug = (slug: string) => slug === "404" || slug.startsWith("404:");
