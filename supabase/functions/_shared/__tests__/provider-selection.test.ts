import { describe, expect, it } from "vitest";
import { selectModuleProvider } from "../provider-selection.ts";

describe("selectModuleProvider", () => {
  it("uses the configured GarageAI default and model", () => {
    expect(selectModuleProvider({
      active_integration: "garageai",
      integration: { type: "garageai", model: "garageai/auto" },
    })).toEqual({ provider: "garageai", model: "garageai/auto", baseUrl: undefined, apiKeyEnv: undefined });
  });

  it("uses the selected provider rather than defaulting to GarageAI", () => {
    expect(selectModuleProvider({
      active_integration: "openai",
      integration: { type: "openai", model: "gpt-4o" },
    })?.provider).toBe("openai");
  });

  it("does not apply another provider's stale model or endpoint", () => {
    expect(selectModuleProvider({
      active_integration: "openai",
      integration: { type: "custom", model: "llama3", base_url: "http://localhost:11434" },
    })).toEqual({ provider: "openai", model: undefined, baseUrl: undefined, apiKeyEnv: undefined });
  });

  it("keeps task-specific Lovable models for the editor", () => {
    expect(selectModuleProvider({
      active_integration: "lovable",
      integration: { type: "lovable", model: "google/gemini-2.5-flash" },
    }, "google/gemini-2.5-pro")?.model).toBe("google/gemini-2.5-pro");
  });

  it("uses the platform fallback for n8n or missing configuration", () => {
    expect(selectModuleProvider({ active_integration: "n8n" })).toBeNull();
    expect(selectModuleProvider(null)).toBeNull();
  });
});
