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
    title: "PainPal - Your Child's Migraine Tracker! ✨",
    description: "Turn migraine tracking into an exciting adventure with PainPal - the first-ever headache diary app designed specifically for kids! Making Health Tracking Fun! Remember how challenging it used to be to get kids to track their headaches? Not anymore! PainPal transforms this important task into an engaging journey.",
    problemStatement: "Children with migraines often struggle to track their symptoms effectively, leading to difficulties in diagnosis and treatment. Traditional tracking methods are boring and not child-friendly.",
    whyBuilt: "I built PainPal to transform the tedious task of headache tracking into a fun adventure for kids. By making the process engaging through gamification, children are more likely to consistently track their symptoms, providing better data for healthcare providers and improving treatment outcomes.",
    image: "/lovable-uploads/feca8484-f150-45bc-ac93-4a2ac80adb7f.png",
    demoLink: "#demo-painpal",
    order: 1
  },
  {
    id: '2',
    title: "PenPal - Your AI Assisted Handwriting Coach",
    description: "Unlock Your Child's Potential with PenPal! Transform your child's handwriting journey into an exciting adventure while getting rewards! This cutting-edge app uses advanced AI to analyze your kid's handwriting, pinpointing exactly what they need to practice. No more struggles or frustration when coaching your kid, - just fun, engaging challenges that keep them motivated to improve!",
    problemStatement: "Many children struggle with handwriting, and parents often lack the tools and knowledge to help them improve effectively. Traditional practice methods can be tedious and demotivating.",
    whyBuilt: "I created PenPal to bridge the gap between AI technology and childhood education. By leveraging AI to analyze handwriting and provide personalized guidance, PenPal makes the learning process enjoyable and effective, reducing frustration for both children and parents.",
    image: "/lovable-uploads/2244a02e-2dae-45d0-a462-adcfe72a4045.png",
    demoLink: "#demo-penpal",
    order: 2
  },
  {
    id: '3',
    title: "AI Strategy Platform",
    description: "A comprehensive platform designed to help businesses integrate AI into their operations seamlessly. Featuring strategy roadmapping, implementation guides, and ROI calculators.",
    problemStatement: "Many businesses want to implement AI but struggle with creating effective strategies and measuring ROI. The lack of structured guidance often leads to failed AI initiatives and wasted resources.",
    whyBuilt: "I developed this platform to demystify AI implementation for businesses of all sizes. By providing clear roadmaps, practical guides, and accurate ROI calculators, companies can make informed decisions about AI integration that align with their specific goals and resources.",
    image: "/lovable-uploads/cac5ccde-8057-40e2-81d7-6b67c95f1e9a.png",
    demoLink: "#demo-ai-strategy",
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
