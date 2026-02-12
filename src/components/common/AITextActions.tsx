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
  Minimize2,
  Zap,
  Megaphone,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type TextAction = 'correct' | 'enhance' | 'expand' | 'summarize' | 'simplify' | 'tone-professional' | 'tone-casual' | 'tone-technical';
type ContentAction = 'generate-outline' | 'generate-intro' | 'generate-conclusion' | 'generate-draft';
type AIAction = TextAction | ContentAction;

interface ActionConfig {
  label: string;
  icon: React.ReactNode;
  description: string;
  category: 'text' | 'content';
  group?: 'tone';
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
  summarize: {
    label: 'Summarize',
    icon: <Minimize2 className="h-3.5 w-3.5" />,
    description: 'Condense to fewer words',
    category: 'text',
  },
  simplify: {
    label: 'Simplify',
    icon: <Zap className="h-3.5 w-3.5" />,
    description: 'Remove jargon, plain language',
    category: 'text',
  },
  'tone-professional': {
    label: 'Professional',
    icon: <Megaphone className="h-3.5 w-3.5" />,
    description: 'Formal business tone',
    category: 'text',
    group: 'tone',
  },
  'tone-casual': {
    label: 'Casual',
    icon: <Megaphone className="h-3.5 w-3.5" />,
    description: 'Friendly conversational tone',
    category: 'text',
    group: 'tone',
  },
  'tone-technical': {
    label: 'Technical',
    icon: <Megaphone className="h-3.5 w-3.5" />,
    description: 'Precise technical writing',
    category: 'text',
    group: 'tone',
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

  // Split into regular actions and tone actions
  const regularActions = availableActions.filter(([_, config]) => !config.group);
  const toneActions = availableActions.filter(([_, config]) => config.group === 'tone');

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

  const renderActionButton = (action: string, config: ActionConfig, variant: 'ghost' | 'outline' = 'ghost') => {
    const canExecute = config.category === 'text' ? canExecuteText : canExecuteContent;
    return (
      <Button
        key={action}
        variant={variant}
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
  };

  const renderToneDropdown = (variant: 'ghost' | 'outline' = 'ghost') => {
    if (toneActions.length === 0) return null;
    const isToneActive = currentAction?.startsWith('tone-');
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size="sm"
            disabled={disabled || isLoading || !canExecuteText}
            className="h-7 px-2 text-xs"
          >
            {isToneActive ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Megaphone className="h-3.5 w-3.5" />
            )}
            <span className="ml-1">Tone</span>
            <ChevronDown className="h-3 w-3 ml-0.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {toneActions.map(([action, config]) => (
            <DropdownMenuItem
              key={action}
              onClick={() => handleAction(action as AIAction)}
              disabled={isLoading}
            >
              {config.label}
              <span className="ml-2 text-muted-foreground text-xs">{config.description}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Simple mode: just show a single row of action buttons
  if (mode === 'text') {
    return (
      <div className={cn('flex items-center gap-1 flex-wrap', className)}>
        {regularActions.map(([action, config]) => renderActionButton(action, config))}
        {renderToneDropdown()}
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
              <p><strong>Draft, Outline, Intro, Conclusion</strong> use the title.</p>
              <p className="mt-1 text-muted-foreground">Correct, Enhance, Expand, Summarize, Simplify & Tone work on the text.</p>
            </TooltipContent>
          </Tooltip>

          {regularActions.map(([action, config]) => renderActionButton(action, config, 'outline'))}
          {renderToneDropdown('outline')}
        </>
      )}
    </div>
  );
};

export default AITextActions;
