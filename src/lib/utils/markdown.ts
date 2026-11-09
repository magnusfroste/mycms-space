// ============================================
// Markdown helpers
// ============================================

/**
 * Strip common inline markdown syntax for short, single-line contexts
 * (cards, list rows, meta descriptions) where rendering markdown is overkill.
 */
export const stripMarkdown = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    // Images ![alt](url) -> alt
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    // Links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // Bold / strikethrough
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/~~(.+?)~~/g, '$1')
    // Italic (*text* / _text_), avoiding snake_case and lone asterisks
    .replace(/(^|[^\w*])\*(?!\s)([^*\n]+?)\*(?!\w)/g, '$1$2')
    .replace(/(^|[^\w_])_(?!\s)([^_\n]+?)_(?!\w)/g, '$1$2')
    // Inline code
    .replace(/`([^`]+)`/g, '$1')
    // Headings, blockquotes and list markers at line start
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Make a GitHub README render outside GitHub: relative image paths
 * (`![x](./docs/a.png)`, `<img src=".github/a.jpg">`) point at the raw file,
 * relative links at the file view on github.com. Absolute URLs and anchors
 * are left alone.
 */
export const resolveReadmeUrls = (markdown: string, fullName: string | null | undefined): string => {
  if (!markdown || !fullName) return markdown;
  const raw = `https://raw.githubusercontent.com/${fullName}/HEAD/`;
  const blob = `https://github.com/${fullName}/blob/HEAD/`;
  const isRelative = (u: string) => !/^([a-z][a-z0-9+.-]*:|\/\/|#|\/)/i.test(u);
  const clean = (u: string) => u.replace(/^\.\//, '');
  return markdown
    // Markdown images: ![alt](path "title")
    .replace(/(!\[[^\]]*\]\()\s*([^)\s]+)([^)]*\))/g, (m, pre, url, post) =>
      isRelative(url) ? `${pre}${raw}${clean(url)}${post}` : m)
    // HTML images: <img ... src="path">
    .replace(/(<img\b[^>]*\bsrc=["'])([^"']+)(["'])/gi, (m, pre, url, post) =>
      isRelative(url) ? `${pre}${raw}${clean(url)}${post}` : m)
    // Markdown links (not images): [text](path)
    .replace(/(^|[^!])(\[[^\]]*\]\()\s*([^)\s]+)([^)]*\))/g, (m, lead, pre, url, post) =>
      isRelative(url) ? `${lead}${pre}${blob}${clean(url)}${post}` : m);
};
