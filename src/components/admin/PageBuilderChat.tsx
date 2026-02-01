// ============================================
// Page Builder Chat Component
// AI-powered chat for building landing pages
// ============================================

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Sparkles, 
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Globe,
  FolderPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePageBuilderChat } from '@/hooks/usePageBuilderChat';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import type { PageBlock } from '@/types';

interface PageBuilderChatProps {
  currentBlocks: PageBlock[];
  onClose?: () => void;
  onCreateBlock: (blockType: string, config: Record<string, unknown>) => void;
}

const suggestedPrompts = [
  "Create a modern SaaS landing page",
  "I need a portfolio for a photographer",
  "Build a landing page for a restaurant",
  "Help me with a consulting portfolio",
  "Create a hero block with video",
  "Fetch info from https://flowwink.com and create a project",
];

const PageBuilderChat: React.FC<PageBuilderChatProps> = ({
  currentBlocks,
  onClose,
  onCreateBlock,
}) => {
  const [input, setInput] = useState('');
  const [pendingAction, setPendingAction] = useState<{
    type: 'block' | 'project';
    block_type?: string;
    config?: Record<string, unknown>;
    project?: {
      title: string;
      description: string;
      problem_statement?: string;
      why_built?: string;
      demo_link?: string;
    };
    message?: string;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { messages, isLoading, error, sendMessage, clearMessages } = usePageBuilderChat({
    currentBlocks: currentBlocks.map(b => ({ block_type: b.block_type })),
    onBlockAction: (action) => {
      if (action.action === 'create_block' && action.block_type && action.config) {
        setPendingAction({
          type: 'block',
          block_type: action.block_type,
          config: action.config,
          message: action.message,
        });
      } else if (action.action === 'add_project' && action.project) {
        setPendingAction({
          type: 'project',
          project: action.project,
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

  const handleConfirmBlock = async () => {
    if (!pendingAction) return;
    
    if (pendingAction.type === 'block' && pendingAction.block_type && pendingAction.config) {
      onCreateBlock(pendingAction.block_type, pendingAction.config);
      setPendingAction(null);
    } else if (pendingAction.type === 'project' && pendingAction.project) {
      // Projects are now created via block_config - just show a message
      toast({
        title: 'Projects are managed via block editor',
        description: 'Edit the Project Showcase block to add projects.',
      });
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
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-sm">AI Page Builder</h3>
            <p className="text-xs text-muted-foreground">Describe your vision</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearMessages} title="Clear chat">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="space-y-6 py-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Tell me what you want to build and I'll help you create the blocks!
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium px-1">Suggestions:</p>
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
                    'flex gap-2',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
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
                <div className="flex gap-2">
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
        {pendingAction && pendingAction.type === 'block' && (
          <div className="mx-4 mb-2 p-3 rounded-xl bg-primary/10 border border-primary/20 space-y-2">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                Create {pendingAction.block_type} block?
              </span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleConfirmBlock} className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Create
              </Button>
              <Button size="sm" variant="outline" onClick={handleRejectBlock}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Pending Project Action */}
        {pendingAction && pendingAction.type === 'project' && pendingAction.project && (
          <div className="mx-4 mb-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 space-y-3">
            <div className="flex items-center gap-2">
              <FolderPlus className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">
                Add new project?
              </span>
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{pendingAction.project.title}</p>
              <p className="text-muted-foreground text-xs line-clamp-2">
                {pendingAction.project.description}
              </p>
              {pendingAction.project.demo_link && (
                <p className="text-xs flex items-center gap-1 text-primary">
                  <Globe className="h-3 w-3" />
                  {pendingAction.project.demo_link}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleConfirmBlock} 
                className="gap-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-3 w-3" />
                Add
              </Button>
              <Button size="sm" variant="outline" onClick={handleRejectBlock}>
                Cancel
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
              placeholder="Describe what you want to build..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
    </div>
  );
};

export default PageBuilderChat;
