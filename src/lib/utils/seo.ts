// ============================================
// SEO helpers
// ============================================

/** Canonical origin for the public site (matches index.html). */
export const SITE_ORIGIN = 'https://www.froste.eu';

/**
 * Build a canonical URL for a pathname:
 * SITE_ORIGIN + pathname, without trailing slash (except for the root).
 * Query strings and hashes are never part of the canonical URL.
 */
export const buildCanonicalUrl = (pathname: string): string => {
  const clean = (pathname || '/').split(/[?#]/)[0];
  const normalized = clean.length > 1 ? clean.replace(/\/+$/, '') : '/';
  return `${SITE_ORIGIN}${normalized || '/'}`;
};
