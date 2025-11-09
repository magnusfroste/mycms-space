import { setAirtableConfig } from '@/lib/utils/config';

// Configuration service - handles app initialization
export const configService = {
  initialize: (): void => {
    // Get environment variables
    const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY;
    const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
    const tableId = import.meta.env.VITE_AIRTABLE_TABLE_ID;
    const name = import.meta.env.VITE_AIRTABLE_NAME;

    // Set them in localStorage for use throughout the app
    setAirtableConfig({
      apiKey,
      baseId,
      tableId,
      name,
    });
  },
};
