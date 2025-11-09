import { Project } from '@/lib/types/airtable';

// Reusable sorting function for projects
export const sortProjectsByOrder = (projects: Project[]): Project[] => {
  return [...projects].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    return 0;
  });
};
