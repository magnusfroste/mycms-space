
import { toast } from "@/hooks/use-toast";
import { OpenRouterMessage, OpenRouterResponse, ResponseLength, ApiError } from "./types";
import { OPENROUTER_API_URL, createSystemPrompt, getMaxTokens } from "./constants";

/**
 * Determines if a model is free based on its ID
 */
export const isModelFree = (modelId: string): boolean => {
  return modelId.includes(':free') || 
         modelId.includes('free') ||
         modelId.includes('/deepseek-r1-distill-qwen-32b') ||
         modelId.includes('/gemma-3-27b');
};

/**
 * Calls OpenRouter API to get a response from the AI model
 */
export const callOpenRouter = async (
  prompt: string, 
  model: string, 
  persona: string,
  apiKey: string,
  responseLength: ResponseLength = "medium",
  userApiKey?: string
): Promise<string> => {
  // Determine which API key to use
  const modelIsFree = isModelFree(model);
  
  // Get the appropriate API key
  let effectiveApiKey: string;
  
  if (!modelIsFree) {
    // For paid models, prioritize the user's API key
    if (!userApiKey) {
      console.error("No user API key available for paid model:", model);
      toast({
        title: "API Key Required",
        description: "This model requires your own OpenRouter API key. Please add your API key in the settings.",
        variant: "destructive",
      });
      return "Error: This model requires your own OpenRouter API key. Please add your API key in the settings.";
    }
    effectiveApiKey = userApiKey;
    console.log(`Using user API key for paid model: ${model}`);
  } else {
    // For free models, use saved API key (env key), falling back to user key if needed
    effectiveApiKey = apiKey || userApiKey || '';
    console.log(`Using saved API key for free model: ${model}`);
  }
  
  if (!effectiveApiKey) {
    toast({
      title: "API Key Missing",
      description: "No API key available. Please provide an OpenRouter API key.",
      variant: "destructive",
    });
    return "Error: No API key available. Please provide an OpenRouter API key.";
  }

  // Create system prompt based on persona and response length
  const systemPrompt = createSystemPrompt(persona, responseLength);
  
  // Set max tokens based on response length
  const maxTokens = getMaxTokens(responseLength);

  try {
    const messages: OpenRouterMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ];

    console.log(`Calling OpenRouter with model: ${model} using ${!modelIsFree && userApiKey ? "user API key" : "saved API key"}`);

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${effectiveApiKey}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Magnus Froste Labs"
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json() as ApiError;
      console.error("OpenRouter API error:", errorData);
      
      // Handle rate limit errors specifically
      if (response.status === 429) {
        console.error("Rate limit exceeded:", errorData);
        // Show a more specific message for rate limits
        toast({
          title: "API Rate Limit Exceeded",
          description: "You've reached the daily limit for free models. To continue using AI models, please add credits to your OpenRouter account or try again tomorrow.",
          variant: "destructive",
        });
        return "Error: Rate limit exceeded for OpenRouter API. You've reached the daily quota for free models. Please try again tomorrow or add credits to your OpenRouter account.";
      }
      
      // Handle authentication errors
      if (response.status === 401) {
        toast({
          title: "Authentication Error",
          description: "Your API key was rejected. Please check that you've entered a valid OpenRouter API key.",
          variant: "destructive",
        });
        return "Error: Authentication failed. Please check your API key and try again.";
      }
      
      throw new Error(errorData.message || "Failed to get response from OpenRouter");
    }

    const data = await response.json() as OpenRouterResponse;
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling OpenRouter API:", error);
    
    // More descriptive error messages
    let errorMessage = "Failed to connect to OpenRouter API";
    if (error instanceof Error) {
      if (error.message.includes("rate limit")) {
        errorMessage = "You've reached the daily limit for free models. Please try again tomorrow or add credits to your OpenRouter account.";
      } else {
        errorMessage = error.message;
      }
    }
    
    toast({
      title: "API Error",
      description: errorMessage,
      variant: "destructive",
    });
    return `Error: ${errorMessage}`;
  }
};
