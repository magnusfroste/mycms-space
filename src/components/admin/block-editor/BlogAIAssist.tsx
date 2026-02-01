// ============================================
// Blog AI Assist Component
// AI-powered actions for blog writing (outline, intro, conclusion)
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
import { Sparkles, List, MessageSquareText, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type BlogAction = 'generate-outline' | 'generate-intro' | 'generate-conclusion' | 'generate-draft';

interface BlogAIAssistProps {
  title: string;
  content: string;
  onContentChange: (newContent: string) => void;
  disabled?: boolean;
  className?: string;
}

const actionConfig: Record<BlogAction, { label: string; icon: React.ReactNode; description: string }> = {
  'generate-draft': {
    label: 'Generate Full Draft',
    icon: <Sparkles className="h-4 w-4" />,
    description: 'Create a complete blog post',
  },
  'generate-outline': {
    label: 'Generate Outline',
    icon: <List className="h-4 w-4" />,
    description: 'Create a structured outline',
  },
  'generate-intro': {
    label: 'Generate Introduction',
    icon: <MessageSquareText className="h-4 w-4" />,
    description: 'Write an engaging opening',
  },
  'generate-conclusion': {
    label: 'Generate Conclusion',
    icon: <CheckCircle2 className="h-4 w-4" />,
    description: 'Create a strong ending',
  },
};

const BlogAIAssist: React.FC<BlogAIAssistProps> = ({
  title,
  content,
  onContentChange,
  disabled,
  className,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<BlogAction | null>(null);

  const handleGenerate = async (action: BlogAction) => {
    if (!title.trim()) {
      toast({ 
        title: 'Title required', 
        description: 'Please enter a title first so AI can generate relevant content.',
        variant: 'destructive' 
      });
      return;
    }

    setIsLoading(true);
    setCurrentAction(action);

    try {
      const { data, error } = await supabase.functions.invoke('enhance-text', {
        body: { 
          text: content || '', 
          action, 
          title,
          context: 'a blog post in Markdown format' 
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
        let newContent = '';
        
        if (action === 'generate-draft') {
          // Full draft replaces everything
          newContent = data.text;
        } else if (action === 'generate-outline') {
          // If there's existing content, prepend outline
          if (content.trim()) {
            newContent = data.text + '\n\n---\n\n' + content;
          } else {
            newContent = data.text;
          }
        } else if (action === 'generate-intro') {
          // Prepend intro
          newContent = data.text + '\n\n' + content;
        } else if (action === 'generate-conclusion') {
          // Append conclusion
          newContent = content + '\n\n' + data.text;
        }
        
        onContentChange(newContent);
        toast({
          title: actionConfig[action].label + ' complete',
          description: 'Content has been added to your post.',
        });
      }
    } catch (err) {
      console.error('Blog AI assist error:', err);
      toast({
        title: 'Could not generate content',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setCurrentAction(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={className}
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          <span className="ml-1.5">AI Assist</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Generate content based on title
        </div>
        <DropdownMenuSeparator />
        {(Object.keys(actionConfig) as BlogAction[]).map((action) => (
          <DropdownMenuItem
            key={action}
            onClick={() => handleGenerate(action)}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {currentAction === action ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              actionConfig[action].icon
            )}
            <div>
              <div className="font-medium">{actionConfig[action].label}</div>
              <div className="text-xs text-muted-foreground">
                {actionConfig[action].description}
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default BlogAIAssist;
