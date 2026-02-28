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

// ============================================
// Tool Registry
// ============================================

/** All available tools indexed by function name */
export const allTools: Record<string, ToolDefinition> = {
  generate_tailored_cv: cvAgentTool,
  generate_portfolio: portfolioGeneratorTool,
  project_deep_dive: projectDeepDiveTool,
  check_availability: availabilityCheckerTool,
};

/** Tool instructions for the system prompt */
export const toolDescriptions: Record<string, string> = {
  generate_tailored_cv: "**generate_tailored_cv** — When a user pastes a job description or asks about job fit, use this to analyze the match, generate a tailored CV, and write a cover letter.",
  generate_portfolio: "**generate_portfolio** — When a user asks to see relevant work, create a curated portfolio, or wants projects filtered by theme/technology/audience.",
  project_deep_dive: "**project_deep_dive** — When a user asks for details about a specific project, wants to understand technical decisions, or says 'tell me more about X'.",
  check_availability: "**check_availability** — When a user asks about availability, hiring, booking, consulting, or scheduling.",
};

/** Get filtered tools based on enabled tool IDs */
export function getActiveTools(enabledTools?: string[]): ToolDefinition[] {
  if (!enabledTools?.length) return Object.values(allTools);
  return enabledTools
    .filter(id => allTools[id])
    .map(id => allTools[id]);
}

/** Get tool instructions for the system prompt */
export function getToolInstructions(enabledTools?: string[]): string {
  const activeNames = enabledTools?.length
    ? Object.keys(toolDescriptions).filter(k => enabledTools.includes(k))
    : Object.keys(toolDescriptions);

  if (activeNames.length === 0) return '';

  const instructions = activeNames.map((name, i) => `${i + 1}. ${toolDescriptions[name]}`).join('\n');
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
