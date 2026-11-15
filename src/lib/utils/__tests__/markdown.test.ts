import { describe, expect, it } from "vitest";
import { resolveReadmeUrls } from "../markdown";

const fix = (md: string) => resolveReadmeUrls(md, "acme/app");
const BLOB = "https://github.com/acme/app/blob/HEAD/";
const RAW = "https://raw.githubusercontent.com/acme/app/HEAD/";

describe("resolveReadmeUrls", () => {
  it("points relative links at the file on GitHub", () => {
    expect(fix("[License](LICENSE)")).toBe(`[License](${BLOB}LICENSE)`);
    expect(fix('<a href="./LICENSE">MIT</a>')).toBe(`<a href="${BLOB}LICENSE">MIT</a>`);
    expect(fix("[mit]: LICENSE")).toBe(`[mit]: ${BLOB}LICENSE`);
  });

  it("points relative images at the raw file", () => {
    expect(fix("![shot](docs/a.png)")).toBe(`![shot](${RAW}docs/a.png)`);
    expect(fix('<img src="./a.jpg">')).toBe(`<img src="${RAW}a.jpg">`);
    expect(fix("[logo]: ./logo.svg")).toBe(`[logo]: ${RAW}logo.svg`);
  });

  it("leaves absolute URLs and anchors alone", () => {
    for (const md of ["[x](https://a.b)", "[x](#usage)", '<a href="mailto:x@y.z">x</a>', "[y]: https://a.b", "[x](/docs)"]) {
      expect(fix(md)).toBe(md);
    }
  });
});
