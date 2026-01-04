import { useEffect } from 'react';

// Hook to track page visits (placeholder - analytics can be reimplemented with Supabase if needed)
export const useAnalytics = (page: string) => {
  useEffect(() => {
    console.log(`Page visited: ${page}`);
  }, [page]);
};
