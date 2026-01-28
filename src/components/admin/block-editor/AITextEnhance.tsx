// ============================================
// AI Text Enhance Buttons
// Reusable buttons for AI text enhancement (correct, enhance, expand)
// ============================================

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sparkles, Check, Wand2, Expand, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type EnhanceAction = 'correct' | 'enhance' | 'expand';

interface AITextEnhanceProps {
  text: string;
  onTextChange: (newText: string) => void;
  context?: string;
  disabled?: boolean;
  className?: string;
}

const actionConfig: Record<EnhanceAction, { label: string; icon: React.ReactNode; description: string }> = {
  correct: {
    label: 'Rätta',
    icon: <Check className="h-4 w-4" />,
    description: 'Rätta stavfel och grammatik',
  },
  enhance: {
    label: 'Förbättra',
    icon: <Wand2 className="h-4 w-4" />,
    description: 'Gör texten mer professionell',
  },
  expand: {
    label: 'Expandera',
    icon: <Expand className="h-4 w-4" />,
    description: 'Lägg till mer detaljer',
  },
};

const AITextEnhance: React.FC<AITextEnhanceProps> = ({
  text,
  onTextChange,
  context,
  disabled,
  className,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<EnhanceAction | null>(null);

  const handleEnhance = async (action: EnhanceAction) => {
    if (!text.trim()) {
      toast({ title: 'Ingen text att bearbeta', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setCurrentAction(action);

    try {
      const { data, error } = await supabase.functions.invoke('enhance-text', {
        body: { text, action, context },
      });

      if (error) {
        // Handle specific error codes
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          toast({
            title: 'För många förfrågningar',
            description: 'Vänta en stund och försök igen.',
            variant: 'destructive',
          });
        } else if (error.message?.includes('402') || error.message?.includes('credits')) {
          toast({
            title: 'AI-krediter slut',
            description: 'Lägg till krediter för att fortsätta.',
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
        onTextChange(data.text);
        toast({
          title: actionConfig[action].label + ' klar',
          description: 'Texten har uppdaterats.',
        });
      }
    } catch (err) {
      console.error('AI enhance error:', err);
      toast({
        title: 'Kunde inte bearbeta texten',
        description: 'Försök igen senare.',
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
          variant="ghost"
          size="sm"
          className={className}
          disabled={disabled || isLoading || !text.trim()}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          <span className="ml-1.5 text-xs">AI</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {(Object.keys(actionConfig) as EnhanceAction[]).map((action) => (
          <DropdownMenuItem
            key={action}
            onClick={() => handleEnhance(action)}
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

export default AITextEnhance;
