// ============================================
// Page Builder Chat Component
// AI-powered chat for building landing pages
// ============================================

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Loader2, 
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePageBuilderChat } from '@/hooks/usePageBuilderChat';
import ReactMarkdown from 'react-markdown';
import type { PageBlock } from '@/types';

interface PageBuilderChatProps {
  currentBlocks: PageBlock[];
  onClose?: () => void;
  onCreateBlock: (blockType: string, config: Record<string, unknown>) => void;
}

const suggestedPrompts = [
  "Skapa en modern SaaS-landningssida",
  "Jag behöver en portfolio för en fotograf",
  "Bygg en landningssida för en restaurang",
  "Hjälp mig med en konsultportfölj",
  "Skapa ett hero-block med video",
];

const PageBuilderChat: React.FC<PageBuilderChatProps> = ({
  currentBlocks,
  onClose,
  onCreateBlock,
}) => {
  const [input, setInput] = useState('');
  const [pendingAction, setPendingAction] = useState<{
    block_type: string;
    config: Record<string, unknown>;
    message?: string;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, error, sendMessage, clearMessages } = usePageBuilderChat({
    currentBlocks: currentBlocks.map(b => ({ block_type: b.block_type })),
    onBlockAction: (action) => {
      if (action.action === 'create_block' && action.block_type && action.config) {
        setPendingAction({
          block_type: action.block_type,
          config: action.config,
          message: action.message,
        });
      }
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  const handleSuggestedPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleConfirmBlock = () => {
    if (pendingAction) {
      onCreateBlock(pendingAction.block_type, pendingAction.config);
      setPendingAction(null);
    }
  };

  const handleRejectBlock = () => {
    setPendingAction(null);
  };

  // Remove JSON code blocks from display
  const cleanContent = (content: string) => {
    return content.replace(/```json[\s\S]*?```/g, '').trim();
  };

  return (
    <Card className="flex flex-col h-full border-2 border-primary/20 bg-background/95 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">AI Sidbyggare</CardTitle>
            <p className="text-xs text-muted-foreground">Beskriv din vision</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={clearMessages} title="Rensa chat">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="space-y-6 py-4">
              <div className="text-center space-y-2">
                <Bot className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Berätta vad du vill bygga så hjälper jag dig skapa blocken!
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium px-1">Förslag:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestedPrompt(prompt)}
                      className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex gap-3',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-2 max-w-[80%]',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{cleanContent(msg.content)}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  </div>
                  <div className="bg-muted rounded-2xl px-4 py-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Pending Block Action */}
        {pendingAction && (
          <div className="mx-4 mb-2 p-3 rounded-xl bg-primary/10 border border-primary/20 space-y-2">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                Skapa {pendingAction.block_type} block?
              </span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleConfirmBlock} className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Skapa
              </Button>
              <Button size="sm" variant="outline" onClick={handleRejectBlock}>
                Avbryt
              </Button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mx-4 mb-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Beskriv vad du vill bygga..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PageBuilderChat;
