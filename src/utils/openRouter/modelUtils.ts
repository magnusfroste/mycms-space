
import { toast } from "@/hooks/use-toast";
import { OpenRouterModel, ApiError } from "./types";
import { OPENROUTER_MODELS_URL } from "./constants";

/**
 * Fetches available models from OpenRouter API
 */
export const fetchOpenRouterModels = async (apiKey: string): Promise<OpenRouterModel[]> => {
  if (!apiKey) {
    toast({
      title: "API Key Missing",
      description: "Please provide an OpenRouter API key to fetch available models",
      variant: "destructive",
    });
    return [];
  }

  try {
    const response = await fetch(OPENROUTER_MODELS_URL, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.origin,
      },
    });

    if (!response.ok) {
      const errorData = await response.json() as ApiError;
      throw new Error(errorData.message || "Failed to get models from OpenRouter");
    }

    const data = await response.json();
    
    const models: OpenRouterModel[] = data.data.map((model: any) => ({
      id: model.id,
      name: model.name || model.id.split('/').pop(),
      provider: model.id.split('/')[0],
      description: model.description || "",
      isFree: model.id.includes(":free") || model.pricing?.prompt === "0" && model.pricing?.completion === "0"
    }));

    return models.sort((a, b) => {
      if (a.provider === b.provider) {
        return a.name.localeCompare(b.name);
      }
      return a.provider.localeCompare(b.provider);
    });
  } catch (error) {
    console.error("Error fetching OpenRouter models:", error);
    toast({
      title: "API Error",
      description: error instanceof Error ? error.message : "Failed to fetch available models",
      variant: "destructive",
    });
    return [];
  }
};

/**
 * Finds the best matching default model from available models
 */
export const findDefaultModel = (models: OpenRouterModel[], preferredIds: string[]): string | undefined => {
  if (!models.length || !preferredIds.length) {
    return undefined;
  }
  
  // Try exact match first
  for (const preferredId of preferredIds) {
    const exactMatch = models.find(m => m.id === preferredId);
    if (exactMatch) {
      return exactMatch.id;
    }
  }
  
  // If no exact match, try matching by provider 
  for (const preferredId of preferredIds) {
    const [provider] = preferredId.split('/');
    if (!provider) continue;
    
    // Look for any model from this provider
    const providerModel = models.find(m => 
      m.provider.toLowerCase() === provider.toLowerCase() && 
      (m.isFree || preferredId.includes(':free'))
    );
    
    if (providerModel) {
      return providerModel.id;
    }
  }
  
  // Final fallback - any free model or first available model
  const freeModel = models.find(m => m.isFree);
  return freeModel ? freeModel.id : models[0]?.id;
};
