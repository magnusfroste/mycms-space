
import { toast } from "@/hooks/use-toast";
import { ApiError } from "../types";
import { OPENROUTER_API_URL } from "../constants";

/**
 * Checks if the API is available and if free credits are remaining
 * @returns Object with status and message
 */
export const checkApiAvailability = async (
  apiKey: string,
  userApiKey?: string
): Promise<{ available: boolean; message: string }> => {
  try {
    // Use the simplest possible model and prompt to minimize token usage
    const testModel = "nvidia/llama-3.1-nemotron-nano-8b-v1:free";
    const testPrompt = "Hi";
    
    console.log("Testing API availability with minimal request");
    
    // If no API keys at all, fail immediately
    if (!apiKey && !userApiKey) {
      return { 
        available: false, 
        message: "No API key available. Please provide an OpenRouter API key." 
      };
    }
    
    // Try user API key first if provided, as it's most likely to work if the default key is rate-limited
    const effectiveApiKey = userApiKey || apiKey;

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${effectiveApiKey}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Magnus Froste Labs"
      },
      body: JSON.stringify({
        model: testModel,
        messages: [{ role: "user", content: testPrompt }],
        temperature: 0.7,
        max_tokens: 5, // Request only a few tokens to minimize usage
      }),
    });

    if (!response.ok) {
      const errorData = await response.json() as ApiError;
      
      // Handle rate limit specifically
      if (response.status === 429) {
        console.error("Rate limit detected during availability check:", errorData);
        
        // If we used a user API key and hit rate limits, that's a problem
        if (userApiKey) {
          return { 
            available: false, 
            message: "Your API key has reached its rate limit. Please try again later or use a different API key."
          };
        }
        
        // If we're using the default key, suggest adding a personal key
        return { 
          available: false, 
          message: "Free model credits have been used up for today. Add your own API key to continue." 
        };
      }
      
      // Handle authentication issues
      if (response.status === 401) {
        // If an invalid user key was provided, give a more specific message
        if (userApiKey && effectiveApiKey === userApiKey) {
          return { 
            available: false, 
            message: "Your API key seems to be invalid. Please check your API key and try again." 
          };
        }
        
        return { 
          available: false, 
          message: "Authentication failed. Please check your API key and try again." 
        };
      }
      
      return { 
        available: false, 
        message: errorData.message || "Unknown error connecting to OpenRouter API" 
      };
    }

    // If we got here, the API is available and we have credits
    return { available: true, message: "API is available and has credits" };
    
  } catch (error) {
    console.error("Error checking API availability:", error);
    return { 
      available: false, 
      message: error instanceof Error ? error.message : "Unknown error checking API availability" 
    };
  }
};
