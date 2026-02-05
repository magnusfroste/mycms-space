// ============================================
// Message Optimizer
// Reduces payload size by summarizing older messages
// ============================================

import type { ChatMessage } from "./types";

const MAX_RECENT_MESSAGES = 6; // Keep last N messages verbatim
const MAX_SUMMARY_LENGTH = 500; // Max chars for summarized context

/**
 * Summarizes a list of messages into a condensed context string
 */
function summarizeMessages(messages: ChatMessage[]): string {
  if (messages.length === 0) return '';

  // Extract key points from conversation
  const userQuestions = messages
    .filter(m => m.role === 'user')
    .map(m => m.content.slice(0, 100))
    .join('; ');

  const assistantTopics = messages
    .filter(m => m.role === 'assistant')
    .map(m => {
      // Extract first sentence or first 80 chars
      const firstSentence = m.content.split(/[.!?]/)[0];
      return firstSentence.slice(0, 80);
    })
    .join('; ');

  let summary = `[Earlier conversation summary: User asked about: ${userQuestions}. Key responses covered: ${assistantTopics}]`;
  
  // Truncate if too long
  if (summary.length > MAX_SUMMARY_LENGTH) {
    summary = summary.slice(0, MAX_SUMMARY_LENGTH - 3) + '...]';
  }

  return summary;
}

/**
 * Optimizes messages for API payload by summarizing older messages
 * Returns messages ready for API call with reduced token count
 */
export function optimizeMessagesForApi(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length <= MAX_RECENT_MESSAGES) {
    return messages; // No optimization needed
  }

  // Split: older messages to summarize, recent to keep
  const olderMessages = messages.slice(0, -MAX_RECENT_MESSAGES);
  const recentMessages = messages.slice(-MAX_RECENT_MESSAGES);

  // Create summary as a system-style context message
  const summary = summarizeMessages(olderMessages);
  
  if (!summary) {
    return recentMessages;
  }

  // Prepend summary as first user message with context marker
  const summaryMessage: ChatMessage = {
    role: 'user',
    content: summary,
  };

  // Add a brief acknowledgment to maintain turn structure
  const ackMessage: ChatMessage = {
    role: 'assistant',
    content: 'I understand the context from our earlier conversation.',
  };

  return [summaryMessage, ackMessage, ...recentMessages];
}

/**
 * Estimates token count (rough approximation)
 * ~4 chars per token for English text
 */
export function estimateTokens(messages: ChatMessage[]): number {
  const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
  return Math.ceil(totalChars / 4);
}
