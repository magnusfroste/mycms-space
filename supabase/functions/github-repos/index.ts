// ============================================
// GitHub Repos Edge Function
// Fetches public repositories from GitHub API
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
  pushed_at: string;
  created_at: string;
  updated_at: string;
  fork: boolean;
  archived: boolean;
  visibility: string;
}

interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  company: string | null;
  location: string | null;
  blog: string | null;
  twitter_username: string | null;
}

interface TransformedRepo {
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

interface TransformedProfile {
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, includeProfile = true, limit = 10, sort = "pushed" } = await req.json();

    if (!username) {
      return new Response(
        JSON.stringify({ error: "Username is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Optional: Use GitHub token for higher rate limits
    const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
    const headers: Record<string, string> = {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "mycms-chat-github-integration",
    };
    
    if (GITHUB_TOKEN) {
      headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`;
    }

    // Fetch repos
    const reposUrl = `https://api.github.com/users/${username}/repos?sort=${sort}&direction=desc&per_page=${limit}`;
    const reposResponse = await fetch(reposUrl, { headers });

    if (!reposResponse.ok) {
      if (reposResponse.status === 404) {
        return new Response(
          JSON.stringify({ error: "GitHub user not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (reposResponse.status === 403) {
        return new Response(
          JSON.stringify({ error: "GitHub API rate limit exceeded. Try again later or add GITHUB_TOKEN." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`GitHub API error: ${reposResponse.status}`);
    }

    const repos: GitHubRepo[] = await reposResponse.json();

    // Transform repos
    const transformedRepos: TransformedRepo[] = repos
      .filter((repo) => !repo.fork && !repo.archived) // Exclude forks and archived
      .map((repo) => ({
        id: String(repo.id),
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description || "",
        url: repo.html_url,
        homepage: repo.homepage,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        topics: repo.topics || [],
        pushedAt: repo.pushed_at,
        createdAt: repo.created_at,
        isArchived: repo.archived,
        isFork: repo.fork,
      }));

    // Optionally fetch profile
    let profile: TransformedProfile | null = null;
    if (includeProfile) {
      const profileUrl = `https://api.github.com/users/${username}`;
      const profileResponse = await fetch(profileUrl, { headers });
      
      if (profileResponse.ok) {
        const user: GitHubUser = await profileResponse.json();
        profile = {
          username: user.login,
          name: user.name,
          avatarUrl: user.avatar_url,
          profileUrl: user.html_url,
          bio: user.bio,
          publicRepos: user.public_repos,
          followers: user.followers,
          following: user.following,
          company: user.company,
          location: user.location,
          blog: user.blog,
          twitter: user.twitter_username,
        };
      }
    }

    // Get rate limit info
    const rateLimit = {
      remaining: reposResponse.headers.get("X-RateLimit-Remaining"),
      limit: reposResponse.headers.get("X-RateLimit-Limit"),
      reset: reposResponse.headers.get("X-RateLimit-Reset"),
    };

    return new Response(
      JSON.stringify({
        repos: transformedRepos,
        profile,
        rateLimit,
        cached: false,
        fetchedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("GitHub API Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
