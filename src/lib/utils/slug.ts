/** Older blog posts got a 13-digit timestamp at the end of their slug. */
export function withoutSlugTimestamp(slug: string): string {
  return slug.replace(/-\d{13}$/, '');
}
