// ============================================
// In-page anchor helpers
// Resolves nav hashes (e.g. "#project-showcase") to an element on the page,
// with aliases so nav links stored in the DB keep working when a section
// uses a different block type or anchor id.
// ============================================

const ANCHOR_ALIASES: Record<string, string[]> = {
  projects: ['projects', 'portfolio', 'github', 'work'],
  writing: ['blog', 'writing', 'posts'],
  contact: ['contact-form', 'contact', 'cta-banner'],
  about: ['about', 'services', 'expertise-grid'],
  expertise: ['expertise-grid', 'expertise', 'services'],
};

/** Fallback route when an anchor group has no section on the current page. */
const ANCHOR_FALLBACK_ROUTES: Record<string, string> = {
  projects: '/github',
  writing: '/blog',
  contact: '/contact',
};

const normalizeHash = (hash: string): string => {
  try {
    return decodeURIComponent(hash.replace(/^#/, ''));
  } catch {
    return hash.replace(/^#/, '');
  }
};

const aliasGroupFor = (id: string): string | null => {
  for (const [group, ids] of Object.entries(ANCHOR_ALIASES)) {
    if (group === id || ids.includes(id)) return group;
  }
  return null;
};

const findById = (id: string): HTMLElement | null =>
  document.getElementById(id) ||
  document.querySelector<HTMLElement>(`[data-block-type="${CSS.escape(id)}"]`);

/** Find the element for a hash like "#portfolio" (or "portfolio"). */
export const findAnchorElement = (hash: string): HTMLElement | null => {
  const id = normalizeHash(hash);
  if (!id) return null;

  const direct = findById(id);
  if (direct) return direct;

  const group = aliasGroupFor(id);
  if (!group) return null;
  for (const alias of ANCHOR_ALIASES[group]) {
    const el = findById(alias);
    if (el) return el;
  }
  return null;
};

/** Route to use when a hash cannot be resolved on the current page. */
export const getAnchorFallbackRoute = (hash: string): string | null => {
  const group = aliasGroupFor(normalizeHash(hash));
  return group ? ANCHOR_FALLBACK_ROUTES[group] ?? null : null;
};

/** Scroll to the anchor for a hash. Returns true if an element was found. */
export const scrollToAnchor = (hash: string, behavior: ScrollBehavior = 'smooth'): boolean => {
  const el = findAnchorElement(hash);
  if (!el) return false;
  el.scrollIntoView({ behavior, block: 'start' });
  return true;
};
