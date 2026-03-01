// ============================================
// AI Tools Module
// Magnet tool definitions and artifact handling
// ============================================

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ArtifactMeta {
  type: string;
  title: string;
}

// ============================================
// Tool Definitions
// ============================================

export const cvAgentTool: ToolDefinition = {
  type: "function",
  function: {
    name: "generate_tailored_cv",
    description: "Analyze a job description against Magnus's profile and generate a match analysis, tailored CV, and cover letter. Use this tool when a user pastes a job description or asks about job fit.",
    parameters: {
      type: "object",
      properties: {
        overall_score: { type: "number", description: "Overall match score 0-100" },
        summary: { type: "string", description: "One-line summary of the match" },
        match_analysis: {
          type: "array",
          description: "Detailed skill-by-skill match analysis",
          items: {
            type: "object",
            properties: {
              skill: { type: "string" },
              required_level: { type: "number" },
              magnus_level: { type: "number" },
              category: { type: "string" },
            },
            required: ["skill", "required_level", "magnus_level", "category"],
          },
        },
        tailored_cv: { type: "string", description: "A tailored CV in markdown format" },
        cover_letter: { type: "string", description: "A professional cover letter in markdown format" },
      },
      required: ["overall_score", "summary", "match_analysis", "tailored_cv", "cover_letter"],
    },
  },
};

export const portfolioGeneratorTool: ToolDefinition = {
  type: "function",
  function: {
    name: "generate_portfolio",
    description: "Generate a curated portfolio summary based on a specific theme, technology, or audience. Use when a user asks to see relevant work, create a portfolio, or wants a curated selection of projects.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Portfolio title" },
        summary: { type: "string", description: "Brief intro paragraph" },
        projects: {
          type: "array",
          description: "Curated list of relevant projects",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              tech_stack: { type: "array", items: { type: "string" } },
              highlights: { type: "array", items: { type: "string" } },
              url: { type: "string" },
            },
            required: ["name", "description", "tech_stack", "highlights"],
          },
        },
        skills_highlight: {
          type: "array",
          description: "Top skills demonstrated across projects",
          items: {
            type: "object",
            properties: {
              skill: { type: "string" },
              proficiency: { type: "number", description: "0-100" },
            },
            required: ["skill", "proficiency"],
          },
        },
      },
      required: ["title", "summary", "projects", "skills_highlight"],
    },
  },
};

export const projectDeepDiveTool: ToolDefinition = {
  type: "function",
  function: {
    name: "project_deep_dive",
    description: "Provide a comprehensive deep-dive into a specific project. Use when a user asks for details about a particular project or says 'tell me more about X'.",
    parameters: {
      type: "object",
      properties: {
        project_name: { type: "string" },
        tagline: { type: "string", description: "One-line project summary" },
        problem: { type: "string", description: "The problem this project solves" },
        solution: { type: "string", description: "How it solves it (markdown)" },
        tech_stack: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              role: { type: "string", description: "What this tech is used for" },
            },
            required: ["name", "role"],
          },
        },
        key_features: { type: "array", items: { type: "string" }, description: "3-5 notable features" },
        learnings: { type: "string", description: "Key technical learnings (markdown)" },
        url: { type: "string" },
      },
      required: ["project_name", "tagline", "problem", "solution", "tech_stack", "key_features"],
    },
  },
};

export const availabilityCheckerTool: ToolDefinition = {
  type: "function",
  function: {
    name: "check_availability",
    description: "Check Magnus's availability for projects, consulting, or collaboration. Use when a user asks about availability, booking, hiring, or scheduling.",
    parameters: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["available", "limited", "unavailable"] },
        summary: { type: "string", description: "Brief availability summary" },
        engagement_types: {
          type: "array",
          description: "Types of work Magnus is open to",
          items: {
            type: "object",
            properties: {
              type: { type: "string" },
              available: { type: "boolean" },
              details: { type: "string" },
            },
            required: ["type", "available", "details"],
          },
        },
        preferred_contact: { type: "string" },
        next_steps: { type: "string", description: "Suggested next steps (markdown)" },
      },
      required: ["status", "summary", "engagement_types", "preferred_contact", "next_steps"],
    },
  },
};

export const researchTopicTool: ToolDefinition = {
  type: "function",
  function: {
    name: "research_topic",
    description: "Research a topic using web search and return a structured analysis. Use when a user asks to research something, explore trends, or investigate a topic.",
    parameters: {
      type: "object",
      properties: {
        topic: { type: "string", description: "The topic to research" },
        key_findings: { type: "array", items: { type: "string" }, description: "3-5 key findings" },
        trending_angles: { type: "array", items: { type: "string" }, description: "Hot takes or trending angles" },
        relevance: { type: "string", description: "How this relates to the site owner's expertise" },
        suggested_posts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              angle: { type: "string" },
            },
            required: ["title", "angle"],
          },
          description: "2-3 suggested blog post ideas",
        },
      },
      required: ["topic", "key_findings", "trending_angles", "relevance", "suggested_posts"],
    },
  },
};

export const draftBlogPostTool: ToolDefinition = {
  type: "function",
  function: {
    name: "draft_blog_post",
    description: "Draft a blog post on a topic. Use when a user asks to write or create a blog post.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Blog post title" },
        content: { type: "string", description: "Full blog post in markdown" },
        excerpt: { type: "string", description: "Short excerpt (max 160 chars)" },
        seo_keywords: { type: "array", items: { type: "string" }, description: "SEO keywords" },
      },
      required: ["title", "content", "excerpt"],
    },
  },
};

// ============================================
// Admin Tool Definitions (CMS co-pilot mode)
// ============================================

export const runResearchTool: ToolDefinition = {
  type: "function",
  function: {
    name: "run_research",
    description: "Research a topic using web sources. Use when the admin asks to research something, explore trends, or find content ideas.",
    parameters: {
      type: "object",
      properties: {
        topic: { type: "string", description: "The topic to research" },
      },
      required: ["topic"],
    },
  },
};

export const draftAllChannelsTool: ToolDefinition = {
  type: "function",
  function: {
    name: "draft_all_channels",
    description: "Generate multichannel content (blog + LinkedIn + X post) from a topic. Use when admin wants content created for multiple platforms.",
    parameters: {
      type: "object",
      properties: {
        topic: { type: "string", description: "The topic to create content about" },
        blog_title: { type: "string", description: "Blog post title" },
        blog_content: { type: "string", description: "Full blog post in markdown" },
        blog_excerpt: { type: "string", description: "Short excerpt (max 160 chars)" },
        linkedin_post: { type: "string", description: "LinkedIn post text" },
        x_post: { type: "string", description: "X/Twitter post (max 280 chars)" },
      },
      required: ["topic", "blog_title", "blog_content", "linkedin_post", "x_post"],
    },
  },
};

export const listReviewQueueTool: ToolDefinition = {
  type: "function",
  function: {
    name: "list_review_queue",
    description: "List pending tasks in the review queue. Use when admin asks what needs review, what's pending, or what the agent has prepared.",
    parameters: {
      type: "object",
      properties: {
        status_filter: { type: "string", enum: ["needs_review", "all"], description: "Filter by status" },
      },
    },
  },
};

export const approveTaskTool: ToolDefinition = {
  type: "function",
  function: {
    name: "approve_task",
    description: "Approve a pending task for publishing. Use when admin approves a draft or confirms an action.",
    parameters: {
      type: "object",
      properties: {
        task_id: { type: "string", description: "The task ID to approve" },
      },
      required: ["task_id"],
    },
  },
};

export const getSiteStatsTool: ToolDefinition = {
  type: "function",
  function: {
    name: "get_site_stats",
    description: "Get recent site analytics summary. Use when admin asks about stats, traffic, or performance.",
    parameters: {
      type: "object",
      properties: {
        period: { type: "string", enum: ["today", "week", "month"], description: "Time period for stats" },
      },
    },
  },
};

// ============================================
// Tool Registry
// ============================================

/** Public visitor tools */
export const publicTools: Record<string, ToolDefinition> = {
  generate_tailored_cv: cvAgentTool,
  generate_portfolio: portfolioGeneratorTool,
  project_deep_dive: projectDeepDiveTool,
  check_availability: availabilityCheckerTool,
};

/** Admin CMS co-pilot tools */
export const adminTools: Record<string, ToolDefinition> = {
  run_research: runResearchTool,
  draft_blog_post: draftBlogPostTool,
  draft_all_channels: draftAllChannelsTool,
  list_review_queue: listReviewQueueTool,
  approve_task: approveTaskTool,
  get_site_stats: getSiteStatsTool,
  research_topic: researchTopicTool,
};

/** All available tools indexed by function name (backwards compat) */
export const allTools: Record<string, ToolDefinition> = {
  ...publicTools,
  ...adminTools,
};

/** Tool instructions for the system prompt */
export const toolDescriptions: Record<string, string> = {
  generate_tailored_cv: "**generate_tailored_cv** — When a user pastes a job description or asks about job fit, use this to analyze the match, generate a tailored CV, and write a cover letter.",
  generate_portfolio: "**generate_portfolio** — When a user asks to see relevant work, create a curated portfolio, or wants projects filtered by theme/technology/audience.",
  project_deep_dive: "**project_deep_dive** — When a user asks for details about a specific project, wants to understand technical decisions, or says 'tell me more about X'.",
  check_availability: "**check_availability** — When a user asks about availability, hiring, booking, consulting, or scheduling.",
  research_topic: "**research_topic** — When a user asks to research a topic, explore trends, or investigate something. Provides structured findings and blog post suggestions.",
  draft_blog_post: "**draft_blog_post** — When a user asks to write or create a blog post on a topic. Generates a full draft with SEO metadata.",
  run_research: "**run_research** — Research a topic using web sources and return structured findings.",
  draft_all_channels: "**draft_all_channels** — Generate multichannel content (blog + LinkedIn + X) from a single topic.",
  list_review_queue: "**list_review_queue** — Show tasks pending review in the autopilot queue.",
  approve_task: "**approve_task** — Approve and publish a pending task.",
  get_site_stats: "**get_site_stats** — Get recent site analytics and traffic summary.",
};

/** Get filtered tools based on enabled tool IDs and mode */
export function getActiveTools(enabledTools?: string[], mode?: string): ToolDefinition[] {
  const toolPool = mode === 'admin' ? adminTools : publicTools;
  if (!enabledTools?.length) return Object.values(toolPool);
  return enabledTools
    .filter(id => toolPool[id])
    .map(id => toolPool[id]);
}

/** Get tool instructions for the system prompt */
export function getToolInstructions(enabledTools?: string[], mode?: string): string {
  const toolPool = mode === 'admin' ? adminTools : publicTools;
  const activeNames = enabledTools?.length
    ? Object.keys(toolDescriptions).filter(k => enabledTools.includes(k) && toolPool[k])
    : Object.keys(toolPool).filter(k => toolDescriptions[k]);

  if (activeNames.length === 0) return '';

  const instructions = activeNames.map((name, i) => `${i + 1}. ${toolDescriptions[name]}`).join('\n');
  
  if (mode === 'admin') {
    return `\n\n## Tool Instructions\nYou are in CMS co-pilot mode. You have admin tools available:\n\n${instructions}\n\nProactively suggest actions. When tasks are completed, ask what to do next.`;
  }
  
  return `\n\n## Tool Instructions\nYou have several tools available. Use them appropriately:\n\n${instructions}\n\nAlways base your analysis on Magnus's actual profile data. Be honest about gaps while highlighting strengths.`;
}

// ============================================
// Artifact Parsing
// ============================================

/** Map tool name to artifact metadata */
function getArtifactMeta(toolName: string, toolArgs: Record<string, unknown>): ArtifactMeta | null {
  const mapping: Record<string, (args: Record<string, unknown>) => ArtifactMeta> = {
    generate_tailored_cv: () => ({ type: "cv-match", title: "CV Match Analysis" }),
    generate_portfolio: (args) => ({ type: "portfolio", title: (args.title as string) || "Curated Portfolio" }),
    project_deep_dive: (args) => ({ type: "project-deep-dive", title: (args.project_name as string) || "Project Deep Dive" }),
    check_availability: () => ({ type: "availability", title: "Availability" }),
    research_topic: (args) => ({ type: "document", title: `Research: ${(args.topic as string) || "Topic"}` }),
    draft_blog_post: (args) => ({ type: "document", title: (args.title as string) || "Blog Draft" }),
  };

  const factory = mapping[toolName];
  return factory ? factory(toolArgs) : null;
}

/** Parse a tool call response into output + artifacts */
export function parseToolCallResponse(
  toolCall: { function?: { name?: string; arguments?: string } },
  textResponse: string
): { output: string; artifacts?: Array<{ type: string; title: string; data: unknown }> } {
  const toolName = toolCall.function?.name;
  if (!toolName) return { output: textResponse || "I processed your request." };

  try {
    const toolArgs = JSON.parse(toolCall.function!.arguments || '{}');
    const meta = getArtifactMeta(toolName, toolArgs);

    if (meta) {
      return {
        output: textResponse || "Here's what I found:",
        artifacts: [{ type: meta.type, title: meta.title, data: toolArgs }],
      };
    }
  } catch (e) {
    console.error(`[Magnet] Failed to parse tool call ${toolName}:`, e);
  }

  return { output: textResponse || "I tried to process your request but encountered an error." };
}
