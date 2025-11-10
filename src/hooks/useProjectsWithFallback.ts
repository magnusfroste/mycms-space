import { useMemo } from 'react';
import { useProjects } from '@/hooks/useProjectSettings';
import { fallbackProjects } from '@/lib/constants/fallbackData';
import { sortProjectsByOrder } from '@/lib/utils/sorting';
import { Project } from '@/lib/types/airtable';

// Transform database projects to frontend format
const transformProjects = (dbProjects: ReturnType<typeof useProjects>['data']): Project[] => {
  if (!dbProjects) return [];
  
  return dbProjects.map(project => ({
    id: project.id,
    title: project.title,
    description: project.description,
    demoLink: project.demo_link,
    problemStatement: project.problem_statement || undefined,
    whyBuilt: project.why_built || undefined,
    order: project.order_index,
    // Transform images array to frontend format
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

  const displayProjects: Project[] = useMemo(() => {
    return transformedProjects && transformedProjects.length > 0 
      ? transformedProjects 
      : fallbackProjects;
  }, [transformedProjects]);

  const sortedProjects = useMemo(() => {
    return sortProjectsByOrder(displayProjects);
  }, [displayProjects]);

  const usingFallbackData = !transformedProjects || transformedProjects.length === 0;

  return {
    projects: sortedProjects,
    isLoading,
    error,
    usingFallbackData,
  };
};
