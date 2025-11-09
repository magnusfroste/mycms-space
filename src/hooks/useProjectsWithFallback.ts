import { useMemo } from 'react';
import { useProjects } from '@/lib/airtable';
import { fallbackProjects } from '@/lib/constants/fallbackData';
import { sortProjectsByOrder } from '@/lib/utils/sorting';
import { Project } from '@/lib/types/airtable';

// Hook that provides projects with fallback and sorting logic
export const useProjectsWithFallback = () => {
  const { data: projects, isLoading, error } = useProjects();

  const displayProjects: Project[] = useMemo(() => {
    return projects && projects.length > 0 ? projects : fallbackProjects;
  }, [projects]);

  const sortedProjects = useMemo(() => {
    return sortProjectsByOrder(displayProjects);
  }, [displayProjects]);

  const usingFallbackData = !projects || projects.length === 0;

  return {
    projects: sortedProjects,
    isLoading,
    error,
    usingFallbackData,
  };
};
