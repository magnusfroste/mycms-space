// ============================================
// AI Text Actions Component
// Unified AI text enhancement (replaces AITextEnhance + BlogAIAssist)
// ============================================

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sparkles,
  Check,
  Wand2,
  Expand,
  List,
  MessageSquareText,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type TextAction = 'correct' | 'enhance' | 'expand';
type ContentAction = 'generate-outline' | 'generate-intro' | 'generate-conclusion' | 'generate-draft';
type AIAction = TextAction | ContentAction;

interface ActionConfig {
  label: string;
  icon: React.ReactNode;
  description: string;
  category: 'text' | 'content';
}

const actionConfig: Record<AIAction, ActionConfig> = {
  // Text enhancement actions
  correct: {
    label: 'Correct',
    icon: <Check className="h-4 w-4" />,
    description: 'Fix spelling and grammar',
    category: 'text',
  },
  enhance: {
    label: 'Enhance',
    icon: <Wand2 className="h-4 w-4" />,
    description: 'Make text more professional',
    category: 'text',
  },
  expand: {
    label: 'Expand',
    icon: <Expand className="h-4 w-4" />,
    description: 'Add more details',
    category: 'text',
  },
  // Content generation actions (for longer content like blog posts)
  'generate-draft': {
    label: 'Generate Draft',
    icon: <Sparkles className="h-4 w-4" />,
    description: 'Create complete content',
    category: 'content',
  },
  'generate-outline': {
    label: 'Generate Outline',
    icon: <List className="h-4 w-4" />,
    description: 'Create a structured outline',
    category: 'content',
  },
  'generate-intro': {
    label: 'Generate Intro',
    icon: <MessageSquareText className="h-4 w-4" />,
    description: 'Write an engaging opening',
    category: 'content',
  },
  'generate-conclusion': {
    label: 'Generate Conclusion',
    icon: <CheckCircle2 className="h-4 w-4" />,
    description: 'Create a strong ending',
    category: 'content',
  },
};

type AITextActionsMode = 'text' | 'content' | 'both';

interface AITextActionsProps {
  text: string;
  onTextChange: (newText: string) => void;
  title?: string; // Required for content generation
  context?: string;
  mode?: AITextActionsMode;
  disabled?: boolean;
  className?: string;
  variant?: 'ghost' | 'outline';
  size?: 'sm' | 'default';
}

const AITextActions: React.FC<AITextActionsProps> = ({
  text,
  onTextChange,
  title,
  context,
  mode = 'text',
  disabled,
  className,
  variant = 'ghost',
  size = 'sm',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<AIAction | null>(null);

  const availableActions = Object.entries(actionConfig).filter(([_, config]) => {
    if (mode === 'both') return true;
    return config.category === mode;
  });

  const textActions = availableActions.filter(([_, c]) => c.category === 'text');
  const contentActions = availableActions.filter(([_, c]) => c.category === 'content');

  const handleAction = async (action: AIAction) => {
    const config = actionConfig[action];
    
    // Validate input
    if (config.category === 'text' && !text.trim()) {
      toast({ title: 'No text to process', variant: 'destructive' });
      return;
    }
    
    if (config.category === 'content' && !title?.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title first so AI can generate relevant content.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setCurrentAction(action);

    try {
      const { data, error } = await supabase.functions.invoke('enhance-text', {
        body: {
          text,
          action,
          title,
          context: context || (config.category === 'content' ? 'content in Markdown format' : undefined),
        },
      });

      if (error) {
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          toast({
            title: 'Too many requests',
            description: 'Please wait a moment and try again.',
            variant: 'destructive',
          });
        } else if (error.message?.includes('402') || error.message?.includes('credits')) {
          toast({
            title: 'AI credits exhausted',
            description: 'Please add credits to continue.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.text) {
        let newContent = data.text;

        // Handle content placement for generation actions
        if (action === 'generate-outline' && text.trim()) {
          newContent = data.text + '\n\n---\n\n' + text;
        } else if (action === 'generate-intro') {
          newContent = data.text + '\n\n' + text;
        } else if (action === 'generate-conclusion') {
          newContent = text + '\n\n' + data.text;
        }

        onTextChange(newContent);
        toast({
          title: config.label + ' complete',
          description: 'Content has been updated.',
        });
      }
    } catch (err) {
      console.error('AI action error:', err);
      toast({
        title: 'Could not process',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setCurrentAction(null);
    }
  };

  const canExecute = mode === 'text' ? text.trim() : true;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={disabled || isLoading || !canExecute}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          <span className="ml-1.5 text-xs">AI</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {textActions.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Enhance Text
            </div>
            {textActions.map(([action, config]) => (
              <DropdownMenuItem
                key={action}
                onClick={() => handleAction(action as AIAction)}
                disabled={isLoading || !text.trim()}
                className="flex items-center gap-2"
              >
                {currentAction === action ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  config.icon
                )}
                <div>
                  <div className="font-medium">{config.label}</div>
                  <div className="text-xs text-muted-foreground">{config.description}</div>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}

        {textActions.length > 0 && contentActions.length > 0 && <DropdownMenuSeparator />}

        {contentActions.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Generate Content
            </div>
            {contentActions.map(([action, config]) => (
              <DropdownMenuItem
                key={action}
                onClick={() => handleAction(action as AIAction)}
                disabled={isLoading || !title?.trim()}
                className="flex items-center gap-2"
              >
                {currentAction === action ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  config.icon
                )}
                <div>
                  <div className="font-medium">{config.label}</div>
                  <div className="text-xs text-muted-foreground">{config.description}</div>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AITextActions;
