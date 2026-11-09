// ============================================
// Optimized Image
// <img> wrapper for CMS images:
//  - responsive srcset via Supabase image transformations
//  - lazy + async decoding by default; `priority` for LCP images
//  - falls back to the original URL if the transformed one fails
// ============================================

import React, { useState } from 'react';
import { DEFAULT_IMAGE_WIDTHS, imageSrcSet, optimizedImageUrl } from '@/lib/imageUrl';

interface OptimizedImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
  src: string;
  /** Rendered width hint, used for the `src` fallback (default 960). */
  displayWidth?: number;
  /** Candidate widths for srcset. */
  widths?: number[];
  /** Above-the-fold / LCP image: eager load with high fetch priority. */
  priority?: boolean;
  quality?: number;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  displayWidth = 960,
  widths = DEFAULT_IMAGE_WIDTHS,
  priority = false,
  quality,
  sizes = '100vw',
  loading,
  decoding,
  onError,
  ...rest
}) => {
  const [useOriginal, setUseOriginal] = useState(false);

  const finalSrc = useOriginal ? src : optimizedImageUrl(src, displayWidth, quality);
  const srcSet = useOriginal ? undefined : imageSrcSet(src, widths, quality);

  // React 18 doesn't know `fetchPriority`; the lowercase attribute is passed through
  const priorityAttrs = priority ? ({ fetchpriority: 'high' } as Record<string, string>) : {};

  return (
    <img
      {...rest}
      {...priorityAttrs}
      src={finalSrc}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      loading={loading ?? (priority ? 'eager' : 'lazy')}
      decoding={decoding ?? 'async'}
      onError={(e) => {
        if (!useOriginal && finalSrc !== src) setUseOriginal(true);
        onError?.(e);
      }}
    />
  );
};

export default OptimizedImage;
