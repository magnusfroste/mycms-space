// ============================================
// GitHub Integration Types
// ============================================

export interface GitHubRepo {
  id: string;
  name: string;
  fullName: string;
  description: string;
  url: string;
  homepage: string | null;
  language: string | null;
  stars: number;
  forks: number;
  topics: string[];
  pushedAt: string;
  createdAt: string;
  isArchived: boolean;
  isFork: boolean;
}

export interface GitHubProfile {
  username: string;
  name: string | null;
  avatarUrl: string;
  profileUrl: string;
  bio: string | null;
  publicRepos: number;
  followers: number;
  following: number;
  company: string | null;
  location: string | null;
  blog: string | null;
  twitter: string | null;
}

export interface GitHubApiResponse {
  repos: GitHubRepo[];
  profile: GitHubProfile | null;
  rateLimit: {
    remaining: string | null;
    limit: string | null;
    reset: string | null;
  };
  cached: boolean;
  fetchedAt: string;
}

// GitHub Block Config
export interface GitHubBlockConfig {
  username?: string;
  title?: string;
  subtitle?: string;
  showProfile?: boolean;
  showStats?: boolean;
  showLanguages?: boolean;
  showTopics?: boolean;
  maxRepos?: number;
  layout?: 'grid' | 'list' | 'compact';
  sortBy?: 'pushed' | 'stars' | 'created';
  filterLanguage?: string;
  hideForked?: boolean;
  hideArchived?: boolean;
}

// GitHub Module Config (for module settings)
export interface GitHubModuleConfig {
  username: string;
  token_ref?: string; // Reference to secret for higher rate limits
  cache_duration_minutes: number;
  auto_sync: boolean;
  sync_interval_hours: number;
}
