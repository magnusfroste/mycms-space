// ============================================
// Image URL helpers
// Rewrites Supabase Storage public URLs to the image transformation
// endpoint so cards/covers download a resized (and, for browsers that
// accept it, WebP) version instead of multi-MB originals.
//
//   /storage/v1/object/public/<bucket>/<path>
//   -> /storage/v1/render/image/public/<bucket>/<path>?width=..&quality=..
//
// Non-Supabase URLs, SVGs and GIFs are returned untouched.
// ============================================

/**
 * Master switch for Supabase image transformations.
 * Verified working on this project (2026-11): a 1 MB blog cover is
 * served as ~15 KB WebP at width=640. Transformations are billed per
 * origin image on Supabase (Pro plan includes a monthly quota); set to
 * false to serve originals everywhere.
 */
export const ENABLE_SUPABASE_IMAGE_TRANSFORMS = true;

const OBJECT_PATH = '/storage/v1/object/public/';
const RENDER_PATH = '/storage/v1/render/image/public/';
const MAX_WIDTH = 2500; // Supabase transform limit

/** Default widths used for responsive srcset generation. */
export const DEFAULT_IMAGE_WIDTHS = [320, 480, 640, 960, 1280, 1920];

const isTransformable = (url: string): boolean => {
  if (!ENABLE_SUPABASE_IMAGE_TRANSFORMS || !url) return false;
  if (!url.includes(OBJECT_PATH)) return false;
  const path = url.split('?')[0].toLowerCase();
  return !path.endsWith('.svg') && !path.endsWith('.gif');
};

/**
 * Return a resized variant of a Supabase Storage public image URL.
 * Falls back to the original URL for anything that can't be transformed.
 */
export const optimizedImageUrl = (
  url: string | null | undefined,
  width: number,
  quality = 75
): string => {
  if (!url) return '';
  if (!isTransformable(url)) return url;

  const w = Math.min(Math.round(width), MAX_WIDTH);
  const transformed = url.replace(OBJECT_PATH, RENDER_PATH);
  const sep = transformed.includes('?') ? '&' : '?';
  // resize=contain keeps the aspect ratio. With width alone, Supabase keeps the
  // original height and crops the sides (a 1920x1012 screenshot became a
  // 640x1012 strip from the middle).
  return `${transformed}${sep}width=${w}&quality=${quality}&resize=contain`;
};

/** Build a `srcset` string for the given widths, or undefined if not transformable. */
export const imageSrcSet = (
  url: string | null | undefined,
  widths: number[] = DEFAULT_IMAGE_WIDTHS,
  quality = 75
): string | undefined => {
  if (!url || !isTransformable(url)) return undefined;
  return widths.map((w) => `${optimizedImageUrl(url, w, quality)} ${w}w`).join(', ');
};
