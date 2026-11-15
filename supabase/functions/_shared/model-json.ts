// Pure, tolerant JSON parsing for model answers (no Deno imports; unit-tested).

/**
 * Parse JSON a model wrote: strips code fences and prose around it, and on a
 * parse error repairs the usual slips (trailing commas, raw line breaks and
 * tabs inside strings) before giving up.
 */
export function parseModelJson<T>(raw: string): T {
  const cleaned = (raw || "").replace(/^\s*```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  const start = cleaned.search(/[[{]/);
  const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  if (start < 0 || end < start) throw new Error(`Model did not return JSON: ${(raw || "").slice(0, 200)}`);
  const text = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(text) as T;
  } catch (first) {
    try {
      return JSON.parse(repair(text)) as T;
    } catch {
      throw first;
    }
  }
}

function repair(s: string): string {
  let out = "";
  let inString = false;
  let escaped = false;
  for (const ch of s) {
    if (inString) {
      if (escaped) { escaped = false; out += ch; continue; }
      if (ch === "\\") { escaped = true; out += ch; continue; }
      if (ch === '"') { inString = false; out += ch; continue; }
      if (ch === "\n") { out += "\\n"; continue; }
      if (ch === "\r") continue;
      if (ch === "\t") { out += "\\t"; continue; }
      out += ch;
    } else {
      if (ch === '"') inString = true;
      out += ch;
    }
  }
  return out.replace(/,\s*([}\]])/g, "$1");
}
