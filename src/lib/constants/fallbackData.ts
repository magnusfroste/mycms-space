import { Project, ExpertiseArea } from '@/types';

// Fallback project type for display purposes
interface FallbackProject {
  id: string;
  title: string;
  description: string;
  problemStatement?: string;
  whyBuilt?: string;
  image?: string;
  images?: string[];
  demoLink: string;
  order?: number;
}

export const fallbackProjects: FallbackProject[] = [
  {
    id: '1',
    title: 'Projekt Exempel 1',
    description: 'Beskriv ditt första projekt här. Förklara vad det handlar om och vilken nytta det ger.',
    problemStatement: 'Beskriv problemet som projektet löser.',
    whyBuilt: 'Förklara varför ni byggde denna lösning och vilken inverkan den har.',
    demoLink: '#',
    order: 1
  },
  {
    id: '2',
    title: 'Projekt Exempel 2',
    description: 'Beskriv ditt andra projekt här. Lyft fram de viktigaste funktionerna och fördelarna.',
    problemStatement: 'Beskriv problemet som projektet löser.',
    whyBuilt: 'Förklara varför ni byggde denna lösning och vilken inverkan den har.',
    demoLink: '#',
    order: 2
  },
  {
    id: '3',
    title: 'Projekt Exempel 3',
    description: 'Beskriv ditt tredje projekt här. Visa upp resultatet och värdet för kunden.',
    problemStatement: 'Beskriv problemet som projektet löser.',
    whyBuilt: 'Förklara varför ni byggde denna lösning och vilken inverkan den har.',
    demoLink: '#',
    order: 3
  }
];

export const fallbackExpertiseAreas: Partial<ExpertiseArea>[] = [
  {
    id: '1',
    title: 'AI Integration',
    description: 'Helping organizations leverage AI to transform their operations and create competitive advantages.',
    icon: 'Brain',
  },
  {
    id: '2',
    title: 'Digital Strategy',
    description: 'Crafting comprehensive digital transformation strategies that drive measurable business outcomes.',
    icon: 'Rocket',
  },
  {
    id: '3',
    title: 'Innovation Consulting',
    description: 'Guiding teams through the innovation process from ideation to successful market implementation.',
    icon: 'Lightbulb',
  },
];
