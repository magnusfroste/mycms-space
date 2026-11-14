import { describe, expect, it } from "vitest";
import { SKILLS, isRunnable, operatorSkills, resolveSkills, schemaFromDefinition, skillDef } from "../skills";

describe("skill registry", () => {
  it("has unique names", () => {
    const names = SKILLS.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("only uses handlers agent-execute can run", () => {
    for (const s of SKILLS) expect(isRunnable(s.handler), `${s.name}: ${s.handler}`).toBe(true);
  });

  it("gives every operator skill a valid object schema", () => {
    for (const s of SKILLS.filter((x) => x.parameters)) {
      expect(s.parameters!.type).toBe("object");
      for (const r of s.parameters!.required || []) expect(s.parameters!.properties, `${s.name}.${r}`).toHaveProperty(r);
    }
  });

  it("routes drafting through Autopilot, so drafts land in the review queue", () => {
    expect(skillDef("draft_blog_post")?.handler).toBe("autopilot:blog_draft");
    expect(skillDef("draft_newsletter")?.handler).toBe("autopilot:newsletter_draft");
    expect(skillDef("draft_all_channels")?.handler).toBe("autopilot:multichannel_draft");
  });
});

describe("isRunnable", () => {
  it.each([
    ["db:pages", true], ["db:page_views", true], ["db:contact_messages", true],
    ["module:weekly_digest", true], ["autopilot:research", true], ["edge:github-repos", true],
    ["db:secrets", false], ["module:resume", false], ["module:chrome_extension", false],
    ["edge:agent-execute", false], ["edge:mcp-server", false], ["edge:ai-chat", false],
    ["", false], [null, false],
  ])("%s → %s", (handler, ok) => expect(isRunnable(handler as string | null)).toBe(ok));
});

describe("resolveSkills", () => {
  it("takes everything but enabled from the code for registered skills", () => {
    const [s] = resolveSkills([{ name: "analyze_seo", handler: "db:nonsense", scope: "public", enabled: false, requires_approval: true }]);
    expect(s).toMatchObject({ name: "analyze_seo", handler: "db:pages", scope: "internal", requires_approval: false, enabled: false, registered: true });
  });

  it("drops runtime skills whose handler cannot run, keeps runnable ones (approval by default)", () => {
    const out = resolveSkills([
      { name: "broken", handler: "module:nope", enabled: true },
      { name: "custom_sync", handler: "edge:github-repos", enabled: true, tool_definition: { type: "object", properties: { x: { type: "string" } } } },
    ]);
    expect(out.find((s) => s.name === "broken")).toBeUndefined();
    expect(out.find((s) => s.name === "custom_sync")).toMatchObject({ registered: false, requires_approval: true });
  });

  it("offers operators only enabled, server-side skills", () => {
    const names = operatorSkills([{ name: "weekly_digest", enabled: false }]).map((s) => s.name);
    expect(names).not.toContain("weekly_digest");
    expect(names).not.toContain("generate_portfolio");
    expect(names).not.toContain("get_visitor_insights");
    expect(names).toContain("analyze_analytics");
  });
});

describe("schemaFromDefinition", () => {
  it("reads OpenAI functions, bare schemas and empty objects", () => {
    const params = { type: "object", properties: { a: { type: "string" } }, required: ["a"] };
    expect(schemaFromDefinition({ type: "function", function: { name: "x", parameters: params } })).toEqual(params);
    expect(schemaFromDefinition(params)).toEqual(params);
    expect(schemaFromDefinition({})).toEqual({ type: "object", properties: {} });
    expect(schemaFromDefinition(null)).toEqual({ type: "object", properties: {} });
  });
});
