import { describe, expect, it } from "vitest";
import { cleanAnalysis } from "../text-quality";

const real = "## Key findings\n" +
  "The EU AI Act sets obligations for providers of general purpose models, including documentation and a copyright policy. ".repeat(6);

describe("cleanAnalysis", () => {
  it("keeps real analysis", () => expect(cleanAnalysis(real)).toContain("Key findings"));

  it.each([
    ["DSML markers (seen live)", "</｜DSML｜ parameter>\n</｜DSML｜ invoke>\n</｜DSML｜ calls>"],
    ["XML tool calls", '<invoke name="search"><parameter name="q">ai</parameter></invoke>'],
    ["tool_call tags", '<tool_call>{"name": "web_search", "arguments": {"q": "x"}}</tool_call>'],
    ["[TOOL_CALLS]", '[TOOL_CALLS] [{"name":"search"}]'],
    ["python tag", "<|python_tag|>search(q)"],
    ["empty", ""],
    ["too short", "Nothing much found."],
  ])("rejects %s", (_, text) => expect(cleanAnalysis(text)).toBeNull());

  it("strips markup around real text", () => {
    const out = cleanAnalysis(real + "</｜DSML｜ invoke>")!;
    expect(out).not.toMatch(/DSML|invoke/);
  });
});
