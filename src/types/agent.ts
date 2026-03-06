/**
 * Agent Skill Engine Types
 * Maps to agent_skills, agent_memory, agent_activity, agent_objectives, agent_automations tables
 */

export type AgentScope = 'internal' | 'external' | 'both';
export type AgentSkillCategory = 'content' | 'crm' | 'communication' | 'automation' | 'search' | 'analytics';
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
  enabled: boolean;
  last_triggered_at: string | null;
  next_run_at: string | null;
  run_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}
