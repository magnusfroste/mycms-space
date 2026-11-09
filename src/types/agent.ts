/**
 * Agent Skill Engine Types
 * Maps to agent_skills, agent_memory, agent_activity, agent_objectives, agent_automations tables
 */

export type AgentScope = 'internal' | 'public' | 'both';
/** Categories in use in agent_skills (the column is free text; no CHECK constraint). */
export const AGENT_SKILL_CATEGORIES = [
  { value: 'content', label: 'Content' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'knowledge', label: 'Knowledge' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'communication', label: 'Communication' },
  { value: 'crm', label: 'CRM' },
  { value: 'automation', label: 'Automation' },
  { value: 'integration', label: 'Integration' },
  { value: 'search', label: 'Search' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'internal', label: 'Internal' },
] as const;
export type AgentSkillCategory = (typeof AGENT_SKILL_CATEGORIES)[number]['value'];
export type AgentActivityStatus = 'success' | 'failed' | 'pending_approval' | 'approved' | 'rejected';
export type AgentObjectiveStatus = 'active' | 'completed' | 'paused' | 'failed';
export type AutomationTriggerType = 'cron' | 'event' | 'signal';

export interface AgentSkill {
  id: string;
  name: string;
  description: string | null;
  category: AgentSkillCategory;
  scope: AgentScope;
  tool_definition: Record<string, unknown>;
  handler: string;
  instructions: string | null;
  requires_approval: boolean;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentActivity {
  id: string;
  agent: string;
  skill_id: string | null;
  skill_name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  status: AgentActivityStatus;
  conversation_id: string | null;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface AgentObjective {
  id: string;
  goal: string;
  status: AgentObjectiveStatus;
  constraints: Record<string, unknown>;
  success_criteria: Record<string, unknown>;
  progress: Record<string, unknown>;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentAutomation {
  id: string;
  name: string;
  description: string | null;
  trigger_type: AutomationTriggerType;
  trigger_config: Record<string, unknown>;
  skill_id: string | null;
  skill_name: string;
  skill_arguments: Record<string, unknown>;
  objective_id: string | null;
  enabled: boolean;
  last_triggered_at: string | null;
  next_run_at: string | null;
  run_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}
