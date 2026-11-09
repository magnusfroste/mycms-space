// ============================================
// Google Analytics Component
// Injects GA4 script dynamically based on config
//
// Performance: the gtag.js library is ~540 KB, so it is loaded only
// once and deferred until the page has finished loading and the main
// thread is idle. The gtag() queue (dataLayer) is set up immediately,
// so 'config' and any page_view events sent before the library arrives
// are buffered and processed once it loads - nothing is lost.
//
// NOTE: the GA measurement ID comes from the DB (modules.seo
// module_config.google_analytics_id). If the network shows hits for
// more than one GA4 property, the extra destination is configured on
// the Google tag itself (tagmanager/GA admin "Google tag" settings),
// not in this code.
// ============================================

import { useEffect } from 'react';
import { useSEOModule } from '@/hooks/useSEOModule';

const GTAG_SRC = 'https://www.googletagmanager.com/gtag/js';

let initializedId: string | null = null;

/** Run `cb` after window load, when the browser is idle. */
const whenIdleAfterLoad = (cb: () => void) => {
  const schedule = () => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(cb, { timeout: 4000 });
    } else {
      setTimeout(cb, 2000);
    }
  };
  if (document.readyState === 'complete') {
    schedule();
  } else {
    window.addEventListener('load', schedule, { once: true });
  }
};

const initGoogleAnalytics = (gaId: string) => {
  // Only ever initialise one property, once per session
  if (initializedId) return;
  initializedId = gaId;

  // Set up the command queue right away so early events are buffered
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      // gtag.js expects the Arguments object, not an array
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
  }
  window.gtag('js', new Date());
  window.gtag('config', gaId);

  // Defer the heavy library until the page is loaded and idle
  whenIdleAfterLoad(() => {
    if (document.querySelector(`script[src^="${GTAG_SRC}"]`)) return;
    const script = document.createElement('script');
    script.async = true;
    script.src = `${GTAG_SRC}?id=${encodeURIComponent(gaId)}`;
    document.head.appendChild(script);
  });
};

const GoogleAnalytics = () => {
  const { data: seoModule } = useSEOModule();
  const gaId = seoModule?.module_config?.google_analytics_id?.trim();

  useEffect(() => {
    if (!gaId) return;
    initGoogleAnalytics(gaId);
  }, [gaId]);

  return null;
};

export default GoogleAnalytics;
