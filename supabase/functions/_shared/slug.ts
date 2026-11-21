// Readable URL slugs (pure; unit-tested).

/** "Trace dina agent-loopar — promptloggen räcker inte" → "trace-dina-agent-loopar-promptloggen-racker-inte" */
export function slugify(title: string, maxLength = 90): string {
  const base = (title || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // å→a, ä→a, ö→o, é→e …
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (base.length <= maxLength) return base || "post";
  const cut = base.slice(0, maxLength);
  return cut.slice(0, cut.lastIndexOf("-") > 40 ? cut.lastIndexOf("-") : maxLength).replace(/-+$/, "");
}

/** First free slug: base, then base-2, base-3 … given the slugs already taken. */
export function firstFreeSlug(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
}
