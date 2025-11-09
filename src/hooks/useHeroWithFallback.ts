import { useHero } from '@/lib/airtable';

// Hook that provides hero data with fallback logic
export const useHeroWithFallback = () => {
  const { data: heroData, isLoading, error } = useHero();

  // Fallback hero data
  const fallbackHero = {
    name: 'Magnus Froste',
    tagline: 'Innovation Strategist & AI Integration Expert',
    feature1: 'Innovation',
    feature1Icon: 'Rocket',
    feature2: 'Strategy',
    feature2Icon: 'BarChart',
    feature3: 'AI Integration',
    feature3Icon: 'Brain',
  };

  const displayHero = heroData || fallbackHero;
  const usingFallbackData = !heroData;

  return {
    hero: displayHero,
    isLoading,
    error,
    usingFallbackData,
  };
};
