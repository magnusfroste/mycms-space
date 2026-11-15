import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// Each edge function is deployed on its own with only its folder and _shared/.
// An import from a sibling function's folder builds locally but fails on deploy.
const root = join(__dirname, "..", "..");

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === "__tests__" ? [] : files(p);
    return p.endsWith(".ts") ? [p] : [];
  });
}

describe("edge function imports", () => {
  it("only reach their own folder and _shared/", () => {
    const offenders: string[] = [];
    for (const file of files(root)) {
      const rel = relative(root, file);
      const own = rel.split("/")[0];
      for (const m of readFileSync(file, "utf8").matchAll(/from\s+["'](\.\.?\/[^"']+)["']/g)) {
        const target = relative(root, join(file, "..", m[1])).split("/")[0];
        if (target !== own && target !== "_shared") offenders.push(`${rel} → ${m[1]}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
