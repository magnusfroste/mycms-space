// ============================================
// AI Text Actions Component
// Unified AI text enhancement (replaces AITextEnhance + BlogAIAssist)
// ============================================

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Check,
  Wand2,
  Expand,
  List,
  MessageSquareText,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  correct: {
    label: 'Correct',
    icon: <Check className="h-3.5 w-3.5" />,
    description: 'Fix spelling and grammar',
    category: 'text',
  },
  enhance: {
    label: 'Enhance',
    icon: <Wand2 className="h-3.5 w-3.5" />,
    description: 'Make text more professional',
    category: 'text',
  },
  expand: {
    label: 'Expand',
    icon: <Expand className="h-3.5 w-3.5" />,
    description: 'Add more details',
    category: 'text',
  },
  'generate-draft': {
    label: 'Draft',
    icon: <Sparkles className="h-3.5 w-3.5" />,
    description: 'Create complete content',
    category: 'content',
  },
  'generate-outline': {
    label: 'Outline',
    icon: <List className="h-3.5 w-3.5" />,
    description: 'Create a structured outline',
    category: 'content',
  },
  'generate-intro': {
    label: 'Intro',
    icon: <MessageSquareText className="h-3.5 w-3.5" />,
    description: 'Write an engaging opening',
    category: 'content',
  },
  'generate-conclusion': {
    label: 'Conclusion',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    description: 'Create a strong ending',
    category: 'content',
  },
};

type AITextActionsMode = 'text' | 'content' | 'both';

interface AITextActionsProps {
  text: string;
  onTextChange: (newText: string) => void;
  title?: string;
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
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<AIAction | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const availableActions = Object.entries(actionConfig).filter(([_, config]) => {
    if (mode === 'both') return true;
    return config.category === mode;
  });

  const handleAction = async (action: AIAction) => {
    const config = actionConfig[action];
    
    if (config.category === 'text' && !text.trim()) {
      toast.error('No text to process');
      return;
    }
    
    if (config.category === 'content' && !title?.trim()) {
      toast.error('Please enter a title first so AI can generate relevant content.');
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
          toast.error('Please wait a moment and try again.');
        } else if (error.message?.includes('402') || error.message?.includes('credits')) {
          toast.error('Please add credits to continue.');
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

        if (action === 'generate-outline' && text.trim()) {
          newContent = data.text + '\n\n---\n\n' + text;
        } else if (action === 'generate-intro') {
          newContent = data.text + '\n\n' + text;
        } else if (action === 'generate-conclusion') {
          newContent = text + '\n\n' + data.text;
        }

        onTextChange(newContent);
        toast.success(config.label + ' complete');
      }
    } catch (err) {
      console.error('AI action error:', err);
      toast.error('Please try again later.');
    } finally {
      setIsLoading(false);
      setCurrentAction(null);
    }
  };

  const canExecuteText = text.trim().length > 0;
  const canExecuteContent = !!title?.trim();

  // Simple mode: just show a single row of action buttons
  if (mode === 'text') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {availableActions.map(([action, config]) => (
          <Button
            key={action}
            variant="ghost"
            size="sm"
            onClick={() => handleAction(action as AIAction)}
            disabled={disabled || isLoading || !canExecuteText}
            className="h-7 px-2 text-xs"
            title={config.description}
          >
            {currentAction === action ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              config.icon
            )}
            <span className="ml-1">{config.label}</span>
          </Button>
        ))}
      </div>
    );
  }

  // Content or both mode: show expandable actions
  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled || isLoading}
        className="h-7 px-2 text-xs"
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span className="ml-1">AI</span>
        {isExpanded ? (
          <ChevronUp className="h-3 w-3 ml-1" />
        ) : (
          <ChevronDown className="h-3 w-3 ml-1" />
        )}
      </Button>
      
      {isExpanded && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-[200px]">
              <p><strong>Draft, Outline, Intro, Conclusion</strong> använder titeln.</p>
              <p className="mt-1 text-muted-foreground">Correct, Enhance, Expand arbetar på texten.</p>
            </TooltipContent>
          </Tooltip>

          {availableActions.map(([action, config]) => {
            const canExecute = config.category === 'text' ? canExecuteText : canExecuteContent;
            return (
              <Button
                key={action}
                variant="outline"
                size="sm"
                onClick={() => handleAction(action as AIAction)}
                disabled={disabled || isLoading || !canExecute}
                className="h-7 px-2 text-xs"
                title={config.description}
              >
                {currentAction === action ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  config.icon
                )}
                <span className="ml-1">{config.label}</span>
              </Button>
            );
          })}
        </>
      )}
    </div>
  );
};

export default AITextActions;
