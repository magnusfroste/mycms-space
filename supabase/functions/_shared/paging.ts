// Pure text paging for large tool answers (no Deno imports; unit-tested).

export interface Page {
  text: string;
  offset: number;
  end: number;
  total: number;
  /** Where the next page starts, or null at the end. */
  next_offset: number | null;
}

/**
 * A slice of `text` from `offset`, at most `max` characters, ending at a
 * paragraph (or line) break when one is reasonably close to the limit, so a
 * page does not stop mid-sentence.
 */
export function pageText(text: string, offset = 0, max = 12_000): Page {
  const total = text.length;
  const start = Math.min(Math.max(Math.floor(offset) || 0, 0), total);
  const limit = Math.max(Math.floor(max) || 0, 500);
  let end = Math.min(start + limit, total);
  if (end < total) {
    const window = text.slice(start, end);
    const para = window.lastIndexOf("\n\n");
    const line = window.lastIndexOf("\n");
    const cut = para > limit * 0.6 ? para : line > limit * 0.6 ? line : -1;
    if (cut > 0) end = start + cut;
  }
  return { text: text.slice(start, end), offset: start, end, total, next_offset: end < total ? end : null };
}
