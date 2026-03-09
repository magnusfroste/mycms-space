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

export const saveMemoryTool: ToolDefinition = {
  type: "function",
  function: {
    name: "save_memory",
    description: "Save a fact, learning, or insight to persistent memory. Categories: 'fact', 'lesson', 'soul', 'skill_instruction'.",
    parameters: {
      type: "object",
      properties: {
        category: { type: "string", enum: ["fact", "lesson", "soul", "skill_instruction"] },
        key: { type: "string", description: "Unique key (e.g. 'newsletter-best-practices')" },
        content: { type: "string", description: "The knowledge to persist" },
      },
      required: ["category", "key", "content"],
    },
  },
};

export const listMemoryTool: ToolDefinition = {
  type: "function",
  function: {
    name: "list_memory",
    description: "List all entries in agent memory.",
    parameters: {
      type: "object",
      properties: {
        category_filter: { type: "string", enum: ["all", "fact", "lesson", "soul", "skill_instruction"] },
      },
    },
  },
};

export const soulUpdateTool: ToolDefinition = {
  type: "function",
  function: {
    name: "soul_update",
    description: "Update your identity/personality. Fields: 'identity', 'tone', 'values', 'philosophy'.",
    parameters: {
      type: "object",
      properties: {
        field: { type: "string", description: "Soul field to update" },
        value: { type: "string", description: "New value" },
      },
      required: ["field", "value"],
    },
  },
};

export const skillCreateTool: ToolDefinition = {
  type: "function",
  function: {
    name: "skill_create",
    description: "Create a new skill. Specify name, handler (edge:fn-name, module:name, db:table), and tool_definition.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        handler: { type: "string", description: "Handler route: edge:fn, module:name, db:table" },
        category: { type: "string" },
        scope: { type: "string", enum: ["internal", "public", "both"] },
        requires_approval: { type: "boolean" },
        tool_definition: { type: "object", description: "OpenAI function tool schema" },
      },
      required: ["name", "description", "handler"],
    },
  },
};

export const skillUpdateTool: ToolDefinition = {
  type: "function",
  function: {
    name: "skill_update",
    description: "Update fields on an existing skill.",
    parameters: {
      type: "object",
      properties: {
        skill_name: { type: "string" },
        updates: { type: "object", description: "Fields to update" },
      },
      required: ["skill_name", "updates"],
    },
  },
};

export const skillListTool: ToolDefinition = {
  type: "function",
  function: {
    name: "skill_list",
    description: "List registered skills.",
    parameters: {
      type: "object",
      properties: {
        category: { type: "string" },
        include_disabled: { type: "boolean" },
      },
    },
  },
};

export const skillDisableTool: ToolDefinition = {
  type: "function",
  function: {
    name: "skill_disable",
    description: "Disable a skill by name.",
    parameters: {
      type: "object",
      properties: { skill_name: { type: "string" } },
      required: ["skill_name"],
    },
  },
};

export const skillInstructTool: ToolDefinition = {
  type: "function",
  function: {
    name: "skill_instruct",
    description: "Add rich knowledge/instructions to a skill (like SKILL.md). The AI reads this when executing the skill.",
    parameters: {
      type: "object",
      properties: {
        skill_name: { type: "string" },
        instructions: { type: "string", description: "Markdown instructions for the skill" },
      },
      required: ["skill_name", "instructions"],
    },
  },
};

export const objectiveUpdateTool: ToolDefinition = {
  type: "function",
  function: {
    name: "objective_update_progress",
    description: "Update progress on an active objective.",
    parameters: {
      type: "object",
      properties: {
        objective_id: { type: "string" },
        progress: { type: "object" },
      },
      required: ["objective_id", "progress"],
    },
  },
};

export const objectiveCompleteTool: ToolDefinition = {
  type: "function",
  function: {
    name: "objective_complete",
    description: "Mark an objective as completed.",
    parameters: {
      type: "object",
      properties: { objective_id: { type: "string" } },
      required: ["objective_id"],
    },
  },
};

export const automationCreateTool: ToolDefinition = {
  type: "function",
  function: {
    name: "automation_create",
    description: "Create an automation that triggers a skill on cron/signal/event.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        trigger_type: { type: "string", enum: ["cron", "signal", "event"] },
        trigger_config: { type: "object" },
        skill_name: { type: "string" },
        skill_arguments: { type: "object" },
        enabled: { type: "boolean" },
      },
      required: ["name", "trigger_type", "skill_name"],
    },
  },
};

export const automationListTool: ToolDefinition = {
  type: "function",
  function: {
    name: "automation_list",
    description: "List all automations.",
    parameters: {
      type: "object",
      properties: { enabled_only: { type: "boolean" } },
    },
  },
};

export const reflectTool: ToolDefinition = {
  type: "function",
  function: {
    name: "reflect",
    description: "Analyze performance over past 7 days. Returns skill usage, error rates, suggestions. Auto-persists learnings.",
    parameters: {
      type: "object",
      properties: {
        focus: { type: "string", enum: ["errors", "usage", "automations", "objectives"] },
      },
    },
  },
};

// ============================================
// Tool Registry
// ============================================

export const getVisitorInsightsTool: ToolDefinition = {
  type: "function",
  function: {
    name: "get_visitor_insights",
    description: "Get insights about the current visitor and generate a visual profile card. Use proactively on first message to personalize the greeting, or when asked about the visitor's history. Returns structured data that renders as an interactive artifact card.",
    parameters: {
      type: "object",
      properties: {
        include_recommendations: { type: "boolean", description: "Whether to include content recommendations based on browsing patterns" },
        visitor_type: { type: "string", description: "Detected visitor type based on browsing patterns" },
        interest_scores: {
          type: "array",
          description: "Interest scores (0-100) based on browsing patterns. Provide 4-8 categories.",
          items: {
            type: "object",
            properties: {
              category: { type: "string", description: "Interest category (e.g. Projects, Blog, AI, Contact)" },
              score: { type: "number", description: "Interest score 0-100" },
            },
            required: ["category", "score"],
          },
        },
        summary: { type: "string", description: "One-line summary of the visitor profile" },
        engagement_level: { type: "string", enum: ["new", "curious", "engaged", "power_user"], description: "Visitor engagement level" },
        suggested_topic: { type: "string", description: "Best conversation topic based on visitor interests" },
      },
      required: ["visitor_type", "interest_scores", "summary", "engagement_level"],
    },
  },
};

export const requestMusicTool: ToolDefinition = {
  type: "function",
  function: {
    name: "request_music",
    description: "Generate a music track by delegating to the SoundSpace AI agent. Call this tool IMMEDIATELY when a user wants music, a song, a track, background audio, or any audio generation. Provide a detailed prompt describing genre, mood, tempo, and instruments. The result includes a playable audio URL.",
    parameters: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Description of the desired music (genre, mood, tempo, instruments, etc.)" },
        duration: { type: "number", description: "Track duration in seconds (30-300). Default 120." },
        context: { type: "string", description: "Additional context about what the music is for (e.g. 'background for a portfolio site', 'relaxing café vibe')" },
      },
      required: ["prompt"],
    },
  },
};

/** Public visitor tools */
export const publicTools: Record<string, ToolDefinition> = {
  generate_tailored_cv: cvAgentTool,
  generate_portfolio: portfolioGeneratorTool,
  project_deep_dive: projectDeepDiveTool,
  check_availability: availabilityCheckerTool,
  get_visitor_insights: getVisitorInsightsTool,
  request_music: requestMusicTool,
};

/** Admin CMS co-pilot tools */
export const getSiteStatsTool: ToolDefinition = {
  type: "function",
  function: {
    name: "get_site_stats",
    description: "Get site statistics: page views, messages, subscribers, blog posts, and chat sessions for a given period.",
    parameters: {
      type: "object",
      properties: {
        period_days: { type: "number", description: "Number of days to look back (default 7)" },
      },
    },
  },
};

export const resumeLookupTool: ToolDefinition = {
  type: "function",
  function: {
    name: "resume_lookup",
    description: "Query the structured resume knowledge base. Use to find specific experience, skills, education, or certifications. Useful when answering questions about qualifications or preparing proposals.",
    parameters: {
      type: "object",
      properties: {
        category: { type: "string", enum: ["experience", "education", "certification", "skill", "language", "summary", "all"], description: "Category to query (or 'all')" },
        search_tags: { type: "array", items: { type: "string" }, description: "Optional tags to filter by" },
      },
    },
  },
};

export const addResumeEntryTool: ToolDefinition = {
  type: "function",
  function: {
    name: "add_resume_entry",
    description: "Add a new entry to the resume knowledge base. Use when admin asks to add experience, skills, education, certifications, or languages.",
    parameters: {
      type: "object",
      properties: {
        category: { type: "string", enum: ["experience", "education", "certification", "skill", "language", "summary"], description: "Entry category" },
        title: { type: "string", description: "Title/role/skill name" },
        subtitle: { type: "string", description: "Company, institution, or issuer" },
        description: { type: "string", description: "Detailed description in markdown" },
        start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
        end_date: { type: "string", description: "End date (YYYY-MM-DD), omit if current" },
        is_current: { type: "boolean", description: "Whether this is a current/ongoing entry" },
        tags: { type: "array", items: { type: "string" }, description: "Relevant tags" },
        metadata: { type: "object", description: "Extra data (e.g. { level: 85 } for skills)" },
      },
      required: ["category", "title"],
    },
  },
};

export const updateResumeEntryTool: ToolDefinition = {
  type: "function",
  function: {
    name: "update_resume_entry",
    description: "Update an existing resume entry. Use when admin asks to edit, correct, or modify experience/skills/education details.",
    parameters: {
      type: "object",
      properties: {
        entry_id: { type: "string", description: "ID of the entry to update (use resume_lookup first to find it)" },
        title: { type: "string" },
        subtitle: { type: "string" },
        description: { type: "string", description: "Updated description in markdown" },
        start_date: { type: "string" },
        end_date: { type: "string" },
        is_current: { type: "boolean" },
        tags: { type: "array", items: { type: "string" } },
        metadata: { type: "object" },
        enabled: { type: "boolean" },
      },
      required: ["entry_id"],
    },
  },
};

export const enrichResumeEntryTool: ToolDefinition = {
  type: "function",
  function: {
    name: "enrich_resume_entry",
    description: "Enrich/expand a resume entry's description with more detail, better wording, or additional context. Use when admin asks to make an entry more detailed, professional, or comprehensive. Fetches the current entry, rewrites the description, and saves it.",
    parameters: {
      type: "object",
      properties: {
        entry_id: { type: "string", description: "ID of the entry to enrich (use resume_lookup first)" },
        instructions: { type: "string", description: "How to improve: 'more technical detail', 'add metrics', 'make more concise', etc." },
        new_description: { type: "string", description: "The enriched/rewritten description in markdown" },
        new_tags: { type: "array", items: { type: "string" }, description: "Updated tags if relevant" },
      },
      required: ["entry_id", "new_description"],
    },
  },
};

// ============================================
// File Manager Tools
// ============================================

export const fileListTool: ToolDefinition = {
  type: "function",
  function: {
    name: "file_list",
    description: "List files in a storage bucket. Available buckets: 'cms-files' (general), 'about-me-images', 'featured-images', 'project-images', 'blog-images', 'agent-documents'.",
    parameters: {
      type: "object",
      properties: {
        bucket: { type: "string", description: "Bucket name (default: cms-files)" },
        prefix: { type: "string", description: "Optional folder prefix to filter" },
        limit: { type: "number", description: "Max files to return (default: 100)" },
      },
    },
  },
};

export const fileReadTool: ToolDefinition = {
  type: "function",
  function: {
    name: "file_read",
    description: "Read the text content of a file from storage. Works with .md, .txt, .json, .csv, and similar text files.",
    parameters: {
      type: "object",
      properties: {
        bucket: { type: "string", description: "Bucket name" },
        path: { type: "string", description: "File path within the bucket" },
      },
      required: ["bucket", "path"],
    },
  },
};

export const fileWriteTool: ToolDefinition = {
  type: "function",
  function: {
    name: "file_write",
    description: "Write or overwrite a text file in storage. Creates the file if it doesn't exist.",
    parameters: {
      type: "object",
      properties: {
        bucket: { type: "string", description: "Bucket name (default: cms-files)" },
        path: { type: "string", description: "File path (e.g. 'docs/notes.md')" },
        content: { type: "string", description: "File content to write" },
        content_type: { type: "string", description: "MIME type (default: text/plain)" },
      },
      required: ["path", "content"],
    },
  },
};

export const fileDeleteTool: ToolDefinition = {
  type: "function",
  function: {
    name: "file_delete",
    description: "Delete a file from storage.",
    parameters: {
      type: "object",
      properties: {
        bucket: { type: "string", description: "Bucket name" },
        path: { type: "string", description: "File path to delete" },
      },
      required: ["bucket", "path"],
    },
  },
};

export const browserScrapeTool: ToolDefinition = {
  type: "function",
  function: {
    name: "browser_scrape",
    description: "Scrape a web page using the admin's Chrome extension. Use when the admin asks to fetch, read, or extract content from a URL — especially for pages behind login walls (LinkedIn profiles, etc.) that server-side scraping can't reach. The browser extension runs in the admin's authenticated browser session.",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL to scrape (optional — omit to scrape the admin's currently active browser tab)" },
        reason: { type: "string", description: "Brief explanation of why you need this data" },
      },
    },
  },
};

export const adminTools: Record<string, ToolDefinition> = {
  // Content
  run_research: runResearchTool,
  draft_blog_post: draftBlogPostTool,
  draft_all_channels: draftAllChannelsTool,
  research_topic: researchTopicTool,
  // Queue
  list_review_queue: listReviewQueueTool,
  approve_task: approveTaskTool,
  get_site_stats: getSiteStatsTool,
  // Memory
  save_memory: saveMemoryTool,
  list_memory: listMemoryTool,
  soul_update: soulUpdateTool,
  // Self-modification
  skill_create: skillCreateTool,
  skill_update: skillUpdateTool,
  skill_list: skillListTool,
  skill_disable: skillDisableTool,
  skill_instruct: skillInstructTool,
  // Objectives
  objective_update_progress: objectiveUpdateTool,
  objective_complete: objectiveCompleteTool,
  // Automations
  automation_create: automationCreateTool,
  automation_list: automationListTool,
  // Reflection
  reflect: reflectTool,
  // Resume
  resume_lookup: resumeLookupTool,
  add_resume_entry: addResumeEntryTool,
  update_resume_entry: updateResumeEntryTool,
  enrich_resume_entry: enrichResumeEntryTool,
  // Browser
  browser_scrape: browserScrapeTool,
  // File Manager
  file_list: fileListTool,
  file_read: fileReadTool,
  file_write: fileWriteTool,
  file_delete: fileDeleteTool,
};

/** All available tools indexed by function name (backwards compat) */
export const allTools: Record<string, ToolDefinition> = {
  ...publicTools,
  ...adminTools,
};

/** Tool instructions for the system prompt */
export const toolDescriptions: Record<string, string> = {
  generate_tailored_cv: "**generate_tailored_cv** — Analyze job fit, generate tailored CV and cover letter.",
  generate_portfolio: "**generate_portfolio** — Create a curated portfolio filtered by theme/technology.",
  project_deep_dive: "**project_deep_dive** — Deep-dive into a specific project's technical details.",
  check_availability: "**check_availability** — Check availability for work/consulting.",
  get_visitor_insights: "**get_visitor_insights** — Get browsing insights about the current visitor to personalize the conversation.",
  request_music: "**request_music** — Generate music by delegating to the SoundSpace AI agent via A2A. **ALWAYS call this tool immediately** when a user asks for music, a track, a song, or audio generation. Do NOT describe or explain SoundSpace — just call the tool with a descriptive prompt.",
  research_topic: "**research_topic** — Research a topic with structured findings.",
  draft_blog_post: "**draft_blog_post** — Draft a blog post with SEO metadata.",
  run_research: "**run_research** — Research a topic using web sources.",
  draft_all_channels: "**draft_all_channels** — Generate multichannel content (blog + LinkedIn + X).",
  list_review_queue: "**list_review_queue** — Show pending tasks in the review queue.",
  approve_task: "**approve_task** — Approve and publish a pending task.",
  get_site_stats: "**get_site_stats** — Get site analytics summary.",
  save_memory: "**save_memory** — Persist a fact/learning to long-term memory.",
  list_memory: "**list_memory** — Review stored memories and learnings.",
  soul_update: "**soul_update** — Update your identity/personality traits.",
  skill_create: "**skill_create** — Create a new skill with handler routing.",
  skill_update: "**skill_update** — Update an existing skill's configuration.",
  skill_list: "**skill_list** — List all registered skills.",
  skill_disable: "**skill_disable** — Disable a skill by name.",
  skill_instruct: "**skill_instruct** — Add rich knowledge/instructions to a skill.",
  objective_update_progress: "**objective_update_progress** — Update progress on an objective.",
  objective_complete: "**objective_complete** — Mark an objective as completed.",
  automation_create: "**automation_create** — Create an automation (cron/signal/event trigger).",
  automation_list: "**automation_list** — List all automations.",
  reflect: "**reflect** — Analyze performance, error rates, and auto-persist learnings.",
  resume_lookup: "**resume_lookup** — Query the structured resume knowledge base by category or tags.",
  add_resume_entry: "**add_resume_entry** — Add a new entry (experience, skill, education, etc.) to the resume knowledge base.",
  update_resume_entry: "**update_resume_entry** — Update an existing resume entry's fields.",
  enrich_resume_entry: "**enrich_resume_entry** — Enrich/rewrite a resume entry's description with better detail or wording.",
  browser_scrape: "**browser_scrape** — Scrape a web page via the admin's Chrome extension. Can access login-walled pages (LinkedIn, etc.) since it runs in the admin's browser. Omit URL to scrape the active tab.",
  file_list: "**file_list** — List files in a storage bucket. Use to browse uploaded documents, images, and CMS files.",
  file_read: "**file_read** — Read the text content of a file from storage (.md, .txt, .json, .csv).",
  file_write: "**file_write** — Write or overwrite a text file in storage. Great for generating documents, configs, or notes.",
  file_delete: "**file_delete** — Delete a file from storage.",
};

// Self-modification tools that should always be available in admin mode
const ALWAYS_ON_ADMIN_TOOLS = [
  'save_memory', 'list_memory', 'soul_update',
  'skill_create', 'skill_update', 'skill_list', 'skill_disable', 'skill_instruct',
  'objective_update_progress', 'objective_complete',
  'automation_create', 'automation_list',
  'reflect',
  'resume_lookup', 'add_resume_entry', 'update_resume_entry', 'enrich_resume_entry',
  'browser_scrape',
  'file_list', 'file_read', 'file_write', 'file_delete',
];

/** Get filtered tools based on enabled tool IDs and mode */
export function getActiveTools(enabledTools?: string[], mode?: string): ToolDefinition[] {
  const toolPool = mode === 'admin' ? adminTools : publicTools;
  if (!enabledTools?.length) return Object.values(toolPool);
  const filtered = enabledTools
    .filter(id => toolPool[id])
    .map(id => toolPool[id]);
  // Always include self-modification tools in admin mode
  if (mode === 'admin') {
    for (const toolName of ALWAYS_ON_ADMIN_TOOLS) {
      if (!filtered.find(t => t.function.name === toolName) && adminTools[toolName]) {
        filtered.push(adminTools[toolName]);
      }
    }
  }
  return filtered;
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
  
  return `\n\n## Tool Instructions\nYou have several tools available. Use them proactively — prefer calling a tool over describing what it does:\n\n${instructions}\n\n**IMPORTANT**: When a user asks to create, generate, or make music/audio/tracks/songs, IMMEDIATELY call the request_music tool with a detailed prompt. Do not explain what SoundSpace is or ask follow-up questions — just generate.\n\nAlways base your analysis on Magnus's actual profile data. Be honest about gaps while highlighting strengths.`;
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
    get_visitor_insights: (args) => ({ type: "visitor-profile", title: (args.summary as string) || "Visitor Profile" }),
    request_music: (args) => ({ type: "music-player", title: (args.prompt as string)?.slice(0, 50) || "Generated Music" }),
    research_topic: (args) => ({ type: "document", title: `Research: ${(args.topic as string) || "Topic"}` }),
    draft_blog_post: (args) => ({ type: "document", title: (args.title as string) || "Blog Draft" }),
    run_research: (args) => ({ type: "document", title: `Research: ${(args.topic as string) || "Topic"}` }),
    draft_all_channels: (args) => ({ type: "document", title: `Multichannel: ${(args.topic as string) || "Content"}` }),
    list_review_queue: () => ({ type: "document", title: "Review Queue" }),
    approve_task: () => ({ type: "document", title: "Task Approved" }),
    get_site_stats: () => ({ type: "document", title: "Site Statistics" }),
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
