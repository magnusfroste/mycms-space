// ============================================
// Branding Settings Component
// Theme templates and visual customization
// ============================================

import React, { useEffect, useState } from 'react';
import { Palette, Check, Sparkles, Zap, Terminal } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useModule, useUpdateModule } from '@/models/modules';

interface ThemeTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  preview: {
    background: string;
    primary: string;
    accent: string;
    text: string;
  };
  tags: string[];
}

const themeTemplates: ThemeTemplate[] = [
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Playfair Display + Inter. Rundade hörn, glassmorfism, parallax-animationer.',
    icon: <Sparkles className="h-5 w-5" />,
    preview: {
      background: 'bg-gradient-to-br from-slate-50 to-slate-100',
      primary: 'bg-indigo-500',
      accent: 'bg-orange-400',
      text: 'text-slate-800',
    },
    tags: ['Serif', 'Glass', 'Animerad'],
  },
  {
    id: 'grok',
    name: 'Grok',
    description: 'Darker Grotesque. Vassa kanter, versaler, kompakt. Inga animationer.',
    icon: <Zap className="h-5 w-5" />,
    preview: {
      background: 'bg-gradient-to-br from-neutral-50 to-neutral-100',
      primary: 'bg-neutral-900',
      accent: 'bg-orange-500',
      text: 'text-neutral-900',
    },
    tags: ['Brutalist', 'Statisk', 'Minimal'],
  },
  {
    id: 'sana',
    name: 'Sana',
    description: 'System UI. Mjuka hörn, generöst radavstånd, subtila fades.',
    icon: <Palette className="h-5 w-5" />,
    preview: {
      background: 'bg-gradient-to-br from-white to-slate-50',
      primary: 'bg-violet-500',
      accent: 'bg-violet-400',
      text: 'text-slate-900',
    },
    tags: ['SaaS', 'Läsbar', 'Professionell'],
  },
  {
    id: 'terminal',
    name: 'Terminal',
    description: 'JetBrains Mono. Neon-glow, hårda kanter, kommandorad-estetik.',
    icon: <Terminal className="h-5 w-5" />,
    preview: {
      background: 'bg-gradient-to-br from-black to-neutral-900',
      primary: 'bg-green-500',
      accent: 'bg-cyan-400',
      text: 'text-green-400',
    },
    tags: ['Monospace', 'Hacker', 'Mörk'],
  },
];

const BrandingSettings: React.FC = () => {
  const { toast } = useToast();
  const { data: module, isLoading } = useModule('branding');
  const updateModule = useUpdateModule('branding');
  
  const [selectedTheme, setSelectedTheme] = useState<'elegant' | 'grok' | 'sana' | 'terminal'>('elegant');
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);

  // Load saved settings
  useEffect(() => {
    if (module?.module_config) {
      const config = module.module_config as { theme?: 'elegant' | 'grok' | 'sana' | 'terminal' };
      setSelectedTheme(config.theme || 'elegant');
    }
  }, [module]);

  // Apply theme to document for preview
  useEffect(() => {
    const theme = previewTheme || selectedTheme;
    if (theme === 'elegant') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    
    // Cleanup on unmount
    return () => {
      if (previewTheme) {
        // Restore saved theme
        if (selectedTheme === 'elegant') {
          document.documentElement.removeAttribute('data-theme');
        } else {
          document.documentElement.setAttribute('data-theme', selectedTheme);
        }
      }
    };
  }, [selectedTheme, previewTheme]);

  const handleSave = async () => {
    try {
      await updateModule.mutateAsync({
        module_config: {
          theme: selectedTheme,
        },
      });
      setPreviewTheme(null);
      toast({ title: 'Theme saved', description: `${themeTemplates.find(t => t.id === selectedTheme)?.name} theme is now active.` });
    } catch {
      toast({ title: 'Error saving theme', variant: 'destructive' });
    }
  };

  const handleThemeSelect = (themeId: 'elegant' | 'grok' | 'sana' | 'terminal') => {
    setSelectedTheme(themeId);
    setPreviewTheme(themeId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Palette className="h-8 w-8 animate-pulse mr-2" />
        Loading branding settings...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Palette className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Branding</h2>
          <p className="text-muted-foreground">
            Choose your visual identity and theme
          </p>
        </div>
      </div>

      {/* Theme Templates */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-medium">Theme Template</Label>
          {previewTheme && (
            <Badge variant="secondary" className="animate-pulse">
              Previewing...
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {themeTemplates.map((template) => (
            <Card
              key={template.id}
              className={cn(
                'relative cursor-pointer overflow-hidden transition-all duration-300',
                'hover:shadow-lg hover:scale-[1.02]',
                selectedTheme === template.id 
                  ? 'ring-2 ring-primary shadow-md' 
                  : 'hover:ring-1 hover:ring-border'
              )}
              onClick={() => handleThemeSelect(template.id as 'elegant' | 'grok' | 'sana' | 'terminal')}
            >
              {/* Preview */}
              <div className={cn('h-24 relative', template.preview.background)}>
                {/* Decorative elements */}
                <div className="absolute inset-4 flex items-end gap-2">
                  <div className={cn('w-16 h-8 rounded-lg', template.preview.primary)} />
                  <div className={cn('w-8 h-8 rounded-lg', template.preview.accent)} />
                  <div className="flex-1 h-4 bg-current opacity-10 rounded" />
                </div>
                
                {/* Selected indicator */}
                {selectedTheme === template.id && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
              
              {/* Info */}
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="text-primary">{template.icon}</div>
                  <h3 className="font-semibold">{template.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.description}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4 pt-4">
        <Button 
          onClick={handleSave} 
          disabled={updateModule.isPending}
          className="px-8"
        >
          {updateModule.isPending ? 'Saving...' : 'Save Theme'}
        </Button>
        {previewTheme && (
          <Button 
            variant="outline" 
            onClick={() => {
              setPreviewTheme(null);
              const savedTheme = (module?.module_config as { theme?: 'elegant' | 'grok' | 'sana' | 'terminal' })?.theme || 'elegant';
              setSelectedTheme(savedTheme);
            }}
          >
            Cancel Preview
          </Button>
        )}
      </div>

      {/* Pro tip */}
      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">Pro tip:</strong> The selected theme affects your entire site. 
        Light/dark mode support will be added in a future update.
      </div>
    </div>
  );
};

export default BrandingSettings;
