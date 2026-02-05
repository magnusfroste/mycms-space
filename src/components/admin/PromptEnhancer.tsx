// ============================================
// Prompt Enhancer Component
// AI assistant for improving system prompts
// Isolated from parent re-renders via React.memo
// ============================================

import React, { useState, useCallback, useRef } from 'react';
import { Wand2, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PromptEnhancerProps {
  currentPrompt: string;
  onEnhanced: (newPrompt: string) => void;
}

type EnhanceAction = 'enhance-prompt' | 'expand-prompt' | 'structure-prompt';

const actions: { action: EnhanceAction; icon: React.ElementType; title: string; description: string }[] = [
  { action: 'enhance-prompt', icon: Sparkles, title: 'Improve', description: 'Make it clearer and more effective' },
  { action: 'expand-prompt', icon: Wand2, title: 'Expand', description: 'Add more detail and examples' },
  { action: 'structure-prompt', icon: Wand2, title: 'Structure', description: 'Organize with headings and sections' },
];

const PromptEnhancer: React.FC<PromptEnhancerProps> = React.memo(({
  currentPrompt,
  onEnhanced,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Store prompt at dialog open time to avoid stale closures
  const promptRef = useRef(currentPrompt);
  promptRef.current = currentPrompt;

  const enhancePrompt = useCallback((action: EnhanceAction) => {
    const prompt = promptRef.current;
    
    if (!prompt.trim()) {
      toast({
        title: 'No prompt to enhance',
        description: 'Write some text first, then enhance it',
        variant: 'destructive',
      });
      return;
    }

    // Close dialog immediately
    setDialogOpen(false);
    setIsLoading(true);

    supabase.functions.invoke('enhance-prompt', {
      body: { text: prompt, action },
    })
      .then(({ data, error }) => {
        if (error) throw error;
        if (data?.text) {
          onEnhanced(data.text);
          toast({ title: 'Prompt enhanced!' });
        } else {
          toast({
            title: 'No response',
            description: 'AI did not return enhanced text',
            variant: 'destructive',
          });
        }
      })
      .catch((err) => {
        console.error('Enhance prompt error:', err);
        toast({
          title: 'Enhancement failed',
          description: err instanceof Error ? err.message : 'Please try again',
          variant: 'destructive',
        });
      })
      .finally(() => setIsLoading(false));
  }, [onEnhanced, toast]);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={isLoading}
        className="gap-2"
        onClick={() => setDialogOpen(true)}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Wand2 className="h-4 w-4" />
        )}
        AI Assist
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              AI Assist
            </DialogTitle>
            <DialogDescription>
              Choose how you want to enhance your prompt
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 py-4">
            {actions.map(({ action, icon: Icon, title, description }) => (
              <button
                key={action}
                onClick={() => enhancePrompt(action)}
                className="w-full flex items-start gap-3 p-3 rounded-lg border hover:bg-muted transition-colors text-left"
              >
                <Icon className="h-5 w-5 mt-0.5 text-primary shrink-0" />
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </button>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

PromptEnhancer.displayName = 'PromptEnhancer';

export default PromptEnhancer;
