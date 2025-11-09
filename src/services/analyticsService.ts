import { logPageVisit, logDemoClick } from '@/lib/airtable';
import { hasAirtableConfig } from '@/lib/utils/config';

// Analytics service - centralized tracking logic
export const analyticsService = {
  trackPageVisit: async (page: string): Promise<void> => {
    if (!hasAirtableConfig()) {
      console.log('Analytics disabled: No Airtable config');
      return;
    }

    try {
      await logPageVisit(page);
      console.log(`Page visit logged: ${page}`);
    } catch (error) {
      console.error(`Failed to log page visit for ${page}:`, error);
    }
  },

  trackDemoClick: async (projectTitle: string): Promise<void> => {
    if (!hasAirtableConfig()) {
      console.log('Analytics disabled: No Airtable config');
      return;
    }

    try {
      await logDemoClick(projectTitle);
      console.log(`Demo click logged: ${projectTitle}`);
    } catch (error) {
      console.error(`Failed to log demo click for ${projectTitle}:`, error);
    }
  },
};
