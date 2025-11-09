import { useMemo } from 'react';
import { hasAirtableConfig } from '@/lib/utils/config';

// Hook to check Airtable configuration
export const useAirtableConfig = () => {
  const isConfigured = useMemo(() => hasAirtableConfig(), []);

  return { isConfigured };
};
