import { describe, expect, it } from "vitest";
import { fetchRows, isNotFoundSlug, periodDays } from "../analytics";

const now = new Date("2026-11-15T12:00:00Z");
const daysBack = (p: unknown, d?: unknown) => Math.round((now.getTime() - periodDays(p, d, now).since.getTime()) / 86_400_000);

describe("periodDays", () => {
  it.each([
    ["week", 7], ["month", 30], ["quarter", 90], ["year", 365],
    ["last_7_days", 7], ["last_30_days", 30], ["30d", 30], ["7", 7],
    [undefined, 7], ["nonsense", 7], ["9999", 365],
  ])("%s → %i days", (p, d) => expect(daysBack(p)).toBe(d));

  it("uses days when given", () => expect(daysBack("week", 14)).toBe(14));

  it("says which period was used", () => {
    expect(periodDays("last_30_days", undefined, now).label).toBe("last_30_days");
    expect(periodDays("nonsense", undefined, now).label).toBe("last_7_days");
    expect(periodDays("today", undefined, now).label).toBe("today");
  });
});

describe("fetchRows", () => {
  it("pages past PostgREST's 1000-row cap", async () => {
    const all = Array.from({ length: 2500 }, (_, i) => i);
    const calls: Array<[number, number]> = [];
    const rows = await fetchRows<number>(async (from, to) => {
      calls.push([from, to]);
      return { data: all.slice(from, to + 1), error: null };
    });
    expect(rows).toHaveLength(2500);
    expect(calls).toEqual([[0, 999], [1000, 1999], [2000, 2999]]);
  });

  it("throws on a query error instead of returning a short list", async () => {
    await expect(fetchRows(async () => ({ data: null, error: { message: "boom" } }))).rejects.toThrow("boom");
  });
});

describe("isNotFoundSlug", () => {
  it.each([["404", true], ["404:/blog/x", true], ["blog", false], ["4040", false]])("%s → %s", (s, ok) =>
    expect(isNotFoundSlug(s as string)).toBe(ok));
});
