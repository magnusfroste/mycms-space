// ============================================
// Chat Utilities
// Helper functions for chat processing
// ============================================

/**
 * Clean webhook response text by removing control characters
 * and normalizing whitespace
 */
export const cleanWebhookResponse = (text: string): string => {
  if (!text || typeof text !== "string") return "";

  return (
    text
      .trim()
      // Remove any control characters except newlines and tabs
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "")
      // Normalize line breaks (convert CRLF and CR to LF)
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      // Remove excessive whitespace but preserve paragraph breaks
      .replace(/\n{3,}/g, "\n\n")
      // Trim each line
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      // Remove any leading/trailing whitespace
      .trim()
  );
};

/**
 * Generate a unique session ID
 */
export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Normalize text for comparison (removes extra whitespace, lowercases)
 */
export const normalizeText = (text: string): string => {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
};
