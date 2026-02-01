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
