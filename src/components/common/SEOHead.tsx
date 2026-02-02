// ============================================
// SEOHead Component
// Dynamic meta tags for pages
// ============================================

import { useEffect } from 'react';
import { useSEOModule } from '@/hooks/useSEOModule';

interface SEOHeadProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  canonicalUrl?: string;
  noIndex?: boolean;
  // For article schema
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
  // Custom JSON-LD
  jsonLd?: Record<string, unknown>;
}

const SEOHead = ({
  title,
  description,
  ogImage,
  ogType = 'website',
  canonicalUrl,
  noIndex = false,
  article,
  jsonLd,
}: SEOHeadProps) => {
  const { data: seoModule } = useSEOModule();
  const config = seoModule?.module_config;

  useEffect(() => {
    if (!config) return;

    // Build the full title
    const fullTitle = title
      ? config.title_template.replace('%s', title)
      : config.site_title;

    // Use provided values or fallback to defaults
    const metaDescription = description || config.site_description;
    const metaOgImage = ogImage || config.default_og_image;
    const fullOgImageUrl = metaOgImage.startsWith('http')
      ? metaOgImage
      : `${config.site_url}${metaOgImage}`;

    // Update document title
    document.title = fullTitle;

    // Helper to update or create meta tag
    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
      }
      tag.content = content;
    };

    // Update meta description
    setMeta('description', metaDescription);

    // Open Graph tags
    setMeta('og:title', fullTitle, true);
    setMeta('og:description', metaDescription, true);
    setMeta('og:image', fullOgImageUrl, true);
    setMeta('og:type', ogType, true);
    setMeta('og:site_name', config.site_title, true);

    if (canonicalUrl) {
      setMeta('og:url', canonicalUrl, true);
      
      // Update or create canonical link
      let canonicalTag = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!canonicalTag) {
        canonicalTag = document.createElement('link');
        canonicalTag.rel = 'canonical';
        document.head.appendChild(canonicalTag);
      }
      canonicalTag.href = canonicalUrl;
    }

    // Twitter Card tags
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', metaDescription);
    setMeta('twitter:image', fullOgImageUrl);
    if (config.twitter_handle) {
      setMeta('twitter:site', config.twitter_handle);
      setMeta('twitter:creator', config.twitter_handle);
    }

    // Article-specific meta tags
    if (article && ogType === 'article') {
      if (article.publishedTime) {
        setMeta('article:published_time', article.publishedTime, true);
      }
      if (article.modifiedTime) {
        setMeta('article:modified_time', article.modifiedTime, true);
      }
      if (article.author) {
        setMeta('article:author', article.author, true);
      }
      if (article.section) {
        setMeta('article:section', article.section, true);
      }
    }

    // Robots meta
    if (noIndex) {
      setMeta('robots', 'noindex, nofollow');
    } else {
      // Remove robots meta if it exists and we don't want noindex
      const robotsTag = document.querySelector('meta[name="robots"]');
      if (robotsTag && robotsTag.getAttribute('content')?.includes('noindex')) {
        robotsTag.remove();
      }
    }

    // JSON-LD structured data
    if (jsonLd) {
      // Remove existing script if any
      const existingScript = document.querySelector('script[data-seo-head="true"]');
      if (existingScript) {
        existingScript.remove();
      }

      // Create new script
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-head', 'true');
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    // Cleanup function
    return () => {
      // Reset title on unmount (optional - React Router handles this)
    };
  }, [config, title, description, ogImage, ogType, canonicalUrl, noIndex, article, jsonLd]);

  // This component doesn't render anything
  return null;
};

export default SEOHead;
