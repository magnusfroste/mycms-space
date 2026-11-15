import { describe, expect, it } from "vitest";
import { parseModelJson } from "../model-json";

describe("parseModelJson", () => {
  it("reads plain JSON and JSON in fences or prose", () => {
    expect(parseModelJson('{"a":1}')).toEqual({ a: 1 });
    expect(parseModelJson('```json\n{"a":[1,2]}\n```')).toEqual({ a: [1, 2] });
    expect(parseModelJson('Here you go:\n{"score": 8}\nHope it helps')).toEqual({ score: 8 });
  });

  it("repairs trailing commas and raw line breaks in strings", () => {
    expect(parseModelJson('{"issues": ["a", "b",], "score": 7,}')).toEqual({ issues: ["a", "b"], score: 7 });
    expect(parseModelJson('{"voice": "line one\nline two\ttab"}')).toEqual({ voice: "line one\nline two\ttab" });
  });

  it("keeps escaped quotes and commas inside strings", () => {
    expect(parseModelJson('{"t": "say \\"hi\\", then ,]"}')).toEqual({ t: 'say "hi", then ,]' });
  });

  it("throws on text without JSON or beyond repair", () => {
    expect(() => parseModelJson("no json here")).toThrow(/did not return JSON/);
    expect(() => parseModelJson('{"a": [1 2]}')).toThrow();
  });
});
