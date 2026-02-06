// ============================================
// Prompt Enhancer Component
// AI assistant for improving system prompts
// Uses Dialog instead of Dropdown for stability
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
import { toast } from 'sonner';

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
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Store prompt at dialog open time to avoid stale closures
  const promptRef = useRef(currentPrompt);
  promptRef.current = currentPrompt;

  const enhancePrompt = useCallback((action: EnhanceAction) => {
    const prompt = promptRef.current;
    
    if (!prompt.trim()) {
      toast.error('Write some text first, then enhance it');
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
          toast.success('Prompt enhanced!');
        } else {
          toast.error('AI did not return enhanced text');
        }
      })
      .catch((err) => {
        console.error('Enhance prompt error:', err);
        toast.error(err instanceof Error ? err.message : 'Please try again');
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
            <button
              onClick={() => enhancePrompt('enhance-prompt')}
              className="w-full flex items-start gap-3 p-3 rounded-lg border hover:bg-muted transition-colors text-left"
            >
              <Sparkles className="h-5 w-5 mt-0.5 text-primary shrink-0" />
              <div>
                <p className="font-medium">Improve</p>
                <p className="text-sm text-muted-foreground">Make it clearer and more effective</p>
              </div>
            </button>
            
            <button
              onClick={() => enhancePrompt('expand-prompt')}
              className="w-full flex items-start gap-3 p-3 rounded-lg border hover:bg-muted transition-colors text-left"
            >
              <Wand2 className="h-5 w-5 mt-0.5 text-primary shrink-0" />
              <div>
                <p className="font-medium">Expand</p>
                <p className="text-sm text-muted-foreground">Add more detail and examples</p>
              </div>
            </button>
            
            <button
              onClick={() => enhancePrompt('structure-prompt')}
              className="w-full flex items-start gap-3 p-3 rounded-lg border hover:bg-muted transition-colors text-left"
            >
              <Wand2 className="h-5 w-5 mt-0.5 text-primary shrink-0" />
              <div>
                <p className="font-medium">Structure</p>
                <p className="text-sm text-muted-foreground">Organize with headings and sections</p>
              </div>
            </button>
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
};

export default PromptEnhancer;
