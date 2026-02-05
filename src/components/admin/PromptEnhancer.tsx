// ============================================
// Prompt Enhancer Component
// AI assistant for improving system prompts
// ============================================

import React, { useState } from 'react';
import { Wand2, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PromptEnhancerProps {
  currentPrompt: string;
  onEnhanced: (newPrompt: string) => void;
}

type EnhanceAction = 'enhance-prompt' | 'expand-prompt' | 'structure-prompt';

const PromptEnhancer: React.FC<PromptEnhancerProps> = ({
  currentPrompt,
  onEnhanced,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const enhancePrompt = async (action: EnhanceAction) => {
    if (!currentPrompt.trim()) {
      toast({
        title: 'No prompt to enhance',
        description: 'Write some text first, then enhance it',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('enhance-prompt', {
        body: { text: currentPrompt, action },
      });

      if (error) throw error;

      if (data?.text) {
        onEnhanced(data.text);
        toast({ title: 'Prompt enhanced!' });
      }
    } catch (err) {
      console.error('Enhance prompt error:', err);
      toast({
        title: 'Enhancement failed',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4" />
          )}
          AI Assist
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => enhancePrompt('enhance-prompt')}>
          <Sparkles className="h-4 w-4 mr-2" />
          <div>
            <p className="font-medium">Improve</p>
            <p className="text-xs text-muted-foreground">
              Make it clearer and more effective
            </p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => enhancePrompt('expand-prompt')}>
          <Wand2 className="h-4 w-4 mr-2" />
          <div>
            <p className="font-medium">Expand</p>
            <p className="text-xs text-muted-foreground">
              Add more detail and examples
            </p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => enhancePrompt('structure-prompt')}>
          <Wand2 className="h-4 w-4 mr-2" />
          <div>
            <p className="font-medium">Structure</p>
            <p className="text-xs text-muted-foreground">
              Organize with headings and sections
            </p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PromptEnhancer;
