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
