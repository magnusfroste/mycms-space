import { useMemo } from 'react';
import { useProjects } from '@/hooks/useProjectSettings';
import { fallbackProjects } from '@/lib/constants/fallbackData';
import { sortByOrder } from '@/lib/utils/sorting';

// Display project type for UI components
export interface DisplayProject {
  id: string;
  title: string;
  description: string;
  demoLink: string;
  problemStatement?: string;
  whyBuilt?: string;
  order?: number;
  image?: string;
  images?: string[];
}

// Transform database projects to frontend format
const transformProjects = (dbProjects: ReturnType<typeof useProjects>['data']): DisplayProject[] => {
  if (!dbProjects) return [];
  
  return dbProjects.map(project => ({
    id: project.id,
    title: project.title,
    description: project.description,
    demoLink: project.demo_link,
    problemStatement: project.problem_statement || undefined,
    whyBuilt: project.why_built || undefined,
    order: project.order_index,
    image: project.images?.[0]?.image_url,
    images: project.images?.map(img => img.image_url) || [],
  }));
};

// Hook that provides projects with fallback and sorting logic
export const useProjectsWithFallback = () => {
  const { data: dbProjects, isLoading, error } = useProjects();

  const transformedProjects = useMemo(() => {
    return transformProjects(dbProjects);
  }, [dbProjects]);

  const displayProjects = useMemo(() => {
    return transformedProjects && transformedProjects.length > 0 
      ? transformedProjects 
      : fallbackProjects;
  }, [transformedProjects]);

  const sortedProjects = useMemo(() => {
    return sortByOrder(displayProjects);
  }, [displayProjects]);

  const usingFallbackData = !transformedProjects || transformedProjects.length === 0;

  return {
    projects: sortedProjects,
    isLoading,
    error,
    usingFallbackData,
  };
};
