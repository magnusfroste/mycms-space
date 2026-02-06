// ============================================
// GitHub Repos Edge Function
// Fetches and updates repositories via GitHub API
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
    const body = await req.json();
    const { action = "fetch" } = body;

    // Optional: Use GitHub token for higher rate limits and write access
    const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
    const headers: Record<string, string> = {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "mycms-chat-github-integration",
    };
    
    if (GITHUB_TOKEN) {
      headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`;
    }

    // ============================================
    // ACTION: SUGGEST-TOPICS - Generate topic suggestions using AI
    // ============================================
    if (action === "suggest-topics") {
      const { owner, repo, enrichedDescription, problemStatement, whyItMatters } = body;

      if (!owner || !repo) {
        return new Response(
          JSON.stringify({ error: "Owner and repo are required for topic suggestions" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch README from GitHub
      let readme = "";
      try {
        const readmeUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;
        const readmeResponse = await fetch(readmeUrl, {
          headers: {
            ...headers,
            "Accept": "application/vnd.github.v3.raw",
          },
        });
        if (readmeResponse.ok) {
          readme = await readmeResponse.text();
          // Truncate README to first 3000 chars to save tokens
          if (readme.length > 3000) {
            readme = readme.substring(0, 3000) + "...";
          }
        }
      } catch (e) {
        console.log("Could not fetch README:", e);
      }

      // Build context for AI
      const contextParts: string[] = [];
      if (enrichedDescription) contextParts.push(`Description: ${enrichedDescription}`);
      if (problemStatement) contextParts.push(`Problem it solves: ${problemStatement}`);
      if (whyItMatters) contextParts.push(`Why it matters: ${whyItMatters}`);
      if (readme) contextParts.push(`README excerpt:\n${readme}`);

      if (contextParts.length === 0) {
        return new Response(
          JSON.stringify({ error: "No content available to generate topics from" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const context = contextParts.join("\n\n");

      // Call Lovable AI
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        return new Response(
          JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are a GitHub SEO expert. Generate 5-8 relevant topic tags for a repository based on the provided context.

Rules:
- Topics must be lowercase, hyphen-separated (no spaces or underscores)
- Each topic should be 1-3 words max
- Focus on: technologies used, problem domain, use cases, project type
- Include both specific (react, typescript) and broader (web-app, developer-tools) topics
- Return ONLY a JSON array of strings, nothing else

Example output: ["react", "typescript", "cms", "portfolio", "open-source", "web-app"]`
            },
            {
              role: "user",
              content: `Generate GitHub topics for this repository:\n\n${context}`
            }
          ],
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error("AI error:", aiResponse.status, errText);
        if (aiResponse.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({ error: "Failed to generate topics" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || "[]";
      
      // Parse topics from response
      let topics: string[] = [];
      try {
        // Extract JSON array from response (might have markdown backticks)
        const jsonMatch = content.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
          topics = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error("Failed to parse topics:", content);
      }

      // Clean and validate topics
      topics = topics
        .filter((t): t is string => typeof t === "string")
        .map(t => t.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""))
        .filter(t => t.length > 1 && t.length <= 50)
        .slice(0, 20); // GitHub allows max 20 topics

      console.log(`Generated ${topics.length} topics for ${owner}/${repo}:`, topics);

      return new Response(
        JSON.stringify({ 
          success: true, 
          topics,
          hadReadme: readme.length > 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    //
    // ACTION: UPDATE - Push data to GitHub
    // ============================================
    if (action === "update") {
      const { owner, repo, description, homepage, topics } = body;

      if (!owner || !repo) {
        return new Response(
          JSON.stringify({ error: "Owner and repo are required for update" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!GITHUB_TOKEN) {
        return new Response(
          JSON.stringify({ error: "GITHUB_TOKEN with write access is required for updates" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const results: { description?: boolean; homepage?: boolean; topics?: boolean } = {};
      const errors: string[] = [];

      // Update description and/or homepage (same endpoint)
      if (description !== undefined || homepage !== undefined) {
        const updatePayload: Record<string, string> = {};
        
        if (description !== undefined) {
          // GitHub has a 350 character limit for descriptions
          const MAX_DESCRIPTION_LENGTH = 350;
          updatePayload.description = description 
            ? description.length > MAX_DESCRIPTION_LENGTH 
              ? description.substring(0, MAX_DESCRIPTION_LENGTH - 3) + "..."
              : description
            : "";
          console.log(`Updating repo ${owner}/${repo} with description (${updatePayload.description.length} chars): ${updatePayload.description.substring(0, 50)}...`);
        }
        
        if (homepage !== undefined) {
          updatePayload.homepage = homepage || "";
          console.log(`Updating repo ${owner}/${repo} with homepage: ${updatePayload.homepage}`);
        }

        const updateUrl = `https://api.github.com/repos/${owner}/${repo}`;
        const updateResponse = await fetch(updateUrl, {
          method: "PATCH",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatePayload),
        });

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          console.error(`GitHub update error: ${updateResponse.status} - ${errorText}`);
          errors.push(`Failed to update repo: ${updateResponse.status}`);
        } else {
          if (description !== undefined) results.description = true;
          if (homepage !== undefined) results.homepage = true;
        }
      }

      // Update topics (separate endpoint)
      if (topics !== undefined && Array.isArray(topics)) {
        console.log(`Updating repo ${owner}/${repo} with topics:`, topics);
        
        const topicsUrl = `https://api.github.com/repos/${owner}/${repo}/topics`;
        const topicsResponse = await fetch(topicsUrl, {
          method: "PUT",
          headers: {
            ...headers,
            "Content-Type": "application/json",
            "Accept": "application/vnd.github.mercy-preview+json", // Required for topics API
          },
          body: JSON.stringify({ names: topics }),
        });

        if (!topicsResponse.ok) {
          const errorText = await topicsResponse.text();
          console.error(`GitHub topics update error: ${topicsResponse.status} - ${errorText}`);
          errors.push(`Failed to update topics: ${topicsResponse.status}`);
        } else {
          results.topics = true;
          console.log(`Successfully updated topics for ${owner}/${repo}`);
        }
      }

      if (Object.keys(results).length === 0 && errors.length > 0) {
        return new Response(
          JSON.stringify({ success: false, error: errors.join(", ") }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Successfully updated ${owner}/${repo}:`, results);

      return new Response(
        JSON.stringify({
          success: true,
          updated: results,
          errors: errors.length > 0 ? errors : undefined,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // ACTION: FETCH - Get repos from GitHub
    // ============================================
    const { username, includeProfile = true, limit = 10, sort = "pushed" } = body;

    if (!username) {
      return new Response(
        JSON.stringify({ error: "Username is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

    // Check if we have write access
    const hasWriteAccess = !!GITHUB_TOKEN;

    return new Response(
      JSON.stringify({
        repos: transformedRepos,
        profile,
        rateLimit,
        hasWriteAccess,
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
