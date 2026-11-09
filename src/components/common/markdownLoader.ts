// Shared dynamic import for the (heavy) markdown renderer chunk.
// Call preloadMarkdown() from pages that are known to render markdown
// so the chunk downloads in parallel with their data fetch.
export const loadMarkdownRenderer = () => import('./MarkdownRenderer');

export const preloadMarkdown = () => {
  void loadMarkdownRenderer();
};
