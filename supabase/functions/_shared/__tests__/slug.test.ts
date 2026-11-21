import { describe, expect, it } from "vitest";
import { slugify, firstFreeSlug } from "../slug";
import { withoutSlugTimestamp } from "../../../../src/lib/utils/slug";

describe("slugify", () => {
  it("transliterates Swedish letters and drops punctuation", () => {
    expect(slugify("Trace dina agent-loopar — promptloggen räcker inte")).toBe("trace-dina-agent-loopar-promptloggen-racker-inte");
    expect(slugify("En agent med verktygsåtkomst är en opålitlig container")).toBe("en-agent-med-verktygsatkomst-ar-en-opalitlig-container");
    expect(slugify("Ökad säkerhet för AI")).toBe("okad-sakerhet-for-ai");
  });
  it("cuts long titles at a word boundary and never returns empty", () => {
    const s = slugify("ord ".repeat(60));
    expect(s.length).toBeLessThanOrEqual(90);
    expect(s.endsWith("-")).toBe(false);
    expect(slugify("—")).toBe("post");
  });
});

describe("firstFreeSlug", () => {
  it("adds -2, -3 … only when taken", () => {
    expect(firstFreeSlug("a", new Set())).toBe("a");
    expect(firstFreeSlug("a", new Set(["a", "a-2"]))).toBe("a-3");
  });
});

describe("withoutSlugTimestamp", () => {
  it("strips a 13-digit timestamp suffix only", () => {
    expect(withoutSlugTimestamp("blast-radius-1794873777678")).toBe("blast-radius");
    expect(withoutSlugTimestamp("ai-2026")).toBe("ai-2026");
  });
});
