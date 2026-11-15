import { describe, expect, it } from "vitest";
import { pageText } from "../paging";

const para = (n: number) => `Paragraph ${n}. ` + "word ".repeat(40).trim();
const doc = Array.from({ length: 50 }, (_, i) => para(i)).join("\n\n");

describe("pageText", () => {
  it("returns everything when it fits", () => {
    const p = pageText("short text", 0, 1000);
    expect(p).toMatchObject({ text: "short text", next_offset: null, total: 10 });
  });

  it("cuts at a paragraph break and points to the next page", () => {
    const p = pageText(doc, 0, 2000);
    expect(p.text.length).toBeLessThanOrEqual(2000);
    expect(p.text.endsWith("word")).toBe(true);
    expect(doc.slice(p.end, p.end + 2)).toBe("\n\n");
    expect(p.next_offset).toBe(p.end);
  });

  it("pages through the whole text without gaps or overlap", () => {
    let offset: number | null = 0;
    let joined = "";
    let pages = 0;
    while (offset !== null && pages < 100) {
      const p = pageText(doc, offset, 1500);
      joined += p.text;
      offset = p.next_offset;
      pages++;
    }
    expect(joined).toBe(doc);
    expect(pages).toBeGreaterThan(1);
  });

  it("clamps bad offsets and tiny limits", () => {
    expect(pageText(doc, -5, 1000).offset).toBe(0);
    expect(pageText(doc, 10 ** 9, 1000)).toMatchObject({ text: "", next_offset: null });
    expect(pageText(doc, 0, 10).text.length).toBeGreaterThanOrEqual(300);
  });
});
