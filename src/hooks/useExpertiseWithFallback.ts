import { useMemo } from 'react';
import { useExpertiseAreas } from '@/lib/airtable';
import { fallbackExpertiseAreas } from '@/lib/constants/fallbackData';
import { ExpertiseArea } from '@/lib/types/airtable';

// Hook that provides expertise areas with fallback logic
export const useExpertiseWithFallback = () => {
  const { data: expertiseData, isLoading, error } = useExpertiseAreas();

  const displayExpertise: ExpertiseArea[] = useMemo(() => {
    return expertiseData && expertiseData.length > 0 
      ? expertiseData 
      : fallbackExpertiseAreas;
  }, [expertiseData]);

  const usingFallbackData = !expertiseData || expertiseData.length === 0;

  return {
    expertise: displayExpertise,
    isLoading,
    error,
    usingFallbackData,
  };
};
