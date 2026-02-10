// ============================================
// Page Builder Chat Hook
// Handles AI chat streaming for page building
// ============================================

import { useState, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface BlockAction {
  action: 'create_block' | 'update_block' | 'suggest' | 'add_project';
  block_type?: string;
  config?: Record<string, unknown>;
  message?: string;
  project?: {
    title: string;
    description: string;
    problem_statement?: string;
    why_built?: string;
    demo_link?: string;
  };
}

interface UsePageBuilderChatProps {
  currentBlocks?: Array<{ block_type: string }>;
  onBlockAction?: (action: BlockAction) => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/page-builder-chat`;

export const usePageBuilderChat = ({ currentBlocks, onBlockAction }: UsePageBuilderChatProps = {}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse ALL block actions from the response (can be multiple)
  const parseBlockActions = (content: string): BlockAction[] => {
    const actions: BlockAction[] = [];
    // Find all JSON blocks in the response
    const jsonMatches = content.matchAll(/```json\s*([\s\S]*?)\s*```/g);
    
    for (const match of jsonMatches) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.action && ['create_block', 'update_block', 'suggest', 'add_project'].includes(parsed.action)) {
          actions.push(parsed as BlockAction);
        }
      } catch {
        // Not valid JSON, skip this block
      }
    }
    return actions;
  };

  const sendMessage = useCallback(async (input: string) => {
    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    let assistantContent = '';

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          currentBlocks,
        }),
      });

      if (!resp.ok) {
        if (resp.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        }
        if (resp.status === 402) {
          throw new Error('AI credits exhausted. Top up in settings.');
        }
        throw new Error('Could not connect to AI');
      }

      if (!resp.body) throw new Error('No response data');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => 
                    i === prev.length - 1 ? { ...m, content: assistantContent } : m
                  );
                }
                return [...prev, { role: 'assistant', content: assistantContent }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Check for block actions in the final response (can be multiple)
      const blockActions = parseBlockActions(assistantContent);
      if (blockActions.length > 0 && onBlockAction) {
        // Execute all block actions sequentially
        for (const action of blockActions) {
          onBlockAction(action);
        }
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Ett fel uppstod';
      setError(errorMessage);
      console.error('Page builder chat error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [messages, currentBlocks, onBlockAction]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
};
