import type { AgentProvider } from "./ai-agent.ts";

export interface ModuleProviderConfig {
  active_integration?: AgentProvider;
  integration?: {
    type?: AgentProvider;
    model?: string;
    base_url?: string;
    api_key_env?: string;
  } | null;
}

export interface ModuleProviderSelection {
  provider: AgentProvider;
  model?: string;
  baseUrl?: string;
  apiKeyEnv?: string;
}

/** Select the direct AI provider configured for the AI module.
 * n8n is chat-specific, so background work uses the platform fallback instead.
 */
export function selectModuleProvider(
  config: ModuleProviderConfig | null | undefined,
  lovableModel?: string,
): ModuleProviderSelection | null {
  const provider = config?.active_integration;
  if (!provider || provider === "n8n") return null;

  const integration = config.integration?.type === provider ? config.integration : undefined;
  return {
    provider,
    // The editor deliberately chooses fast/writer models on the Lovable gateway.
    model: provider === "lovable" ? (lovableModel || integration?.model) : integration?.model,
    baseUrl: integration?.base_url,
    apiKeyEnv: integration?.api_key_env,
  };
}
