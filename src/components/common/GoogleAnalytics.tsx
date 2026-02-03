// ============================================
// Google Analytics Component
// Injects GA4 script dynamically based on config
// ============================================

import { useEffect } from 'react';
import { useSEOModule } from '@/hooks/useSEOModule';

const GoogleAnalytics = () => {
  const { data: seoModule } = useSEOModule();
  const gaId = seoModule?.module_config?.google_analytics_id;

  useEffect(() => {
    if (!gaId || gaId.trim() === '') {
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag"]`);
    if (existingScript) {
      return;
    }

    // Create and inject the GA script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    // Initialize gtag
    const initScript = document.createElement('script');
    initScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}');
    `;
    document.head.appendChild(initScript);

    console.log('[GA] Google Analytics initialized with ID:', gaId);

    // Cleanup function
    return () => {
      // Scripts will remain for the session
    };
  }, [gaId]);

  return null;
};

export default GoogleAnalytics;
