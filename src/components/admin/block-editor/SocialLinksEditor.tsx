// ============================================
// Social Links Editor
// Editor for social media links in About block
// ============================================

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Linkedin, Github, Twitter, Globe, Mail, Instagram, Youtube } from 'lucide-react';
import type { AboutSplitBlockConfig } from '@/types/blockConfigs';

interface SocialLinksEditorProps {
  links: NonNullable<AboutSplitBlockConfig['social_links']>;
  onChange: (links: NonNullable<AboutSplitBlockConfig['social_links']>) => void;
}

type SocialLink = NonNullable<AboutSplitBlockConfig['social_links']>[number];

const PLATFORMS = [
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'github', label: 'GitHub', icon: Github },
  { value: 'twitter', label: 'Twitter / X', icon: Twitter },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'youtube', label: 'YouTube', icon: Youtube },
  { value: 'website', label: 'Website', icon: Globe },
  { value: 'email', label: 'Email', icon: Mail },
] as const;

const SocialLinksEditor: React.FC<SocialLinksEditorProps> = ({
  links,
  onChange,
}) => {
  const handleAddLink = () => {
    // Find first platform not already used
    const usedPlatforms = links.map(l => l.platform);
    const availablePlatform = PLATFORMS.find(p => !usedPlatforms.includes(p.value as SocialLink['platform']));
    
    const newLink: SocialLink = {
      platform: (availablePlatform?.value || 'website') as SocialLink['platform'],
      url: '',
      enabled: true,
    };
    onChange([...links, newLink]);
  };

  const handleUpdateLink = (index: number, updates: Partial<SocialLink>) => {
    const updatedLinks = links.map((link, i) =>
      i === index ? { ...link, ...updates } : link
    );
    onChange(updatedLinks);
  };

  const handleDeleteLink = (index: number) => {
    onChange(links.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">
          Social Links ({links.length})
        </Label>
        <Button 
          onClick={handleAddLink} 
          size="sm" 
          variant="outline" 
          className="gap-2"
          disabled={links.length >= PLATFORMS.length}
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <div className="space-y-3">
        {links.map((link, index) => {
          const platform = PLATFORMS.find(p => p.value === link.platform);
          const Icon = platform?.icon || Globe;
          
          return (
            <Card key={index} className="relative">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {/* Platform Icon */}
                  <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>

                  {/* Platform selector */}
                  <Select
                    value={link.platform}
                    onValueChange={(value) =>
                      handleUpdateLink(index, { platform: value as SocialLink['platform'] })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* URL input */}
                  <Input
                    value={link.url}
                    onChange={(e) =>
                      handleUpdateLink(index, { url: e.target.value })
                    }
                    placeholder={link.platform === 'email' ? 'your@email.com' : 'https://...'}
                    className="flex-1"
                  />

                  {/* Controls */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={link.enabled}
                      onCheckedChange={(enabled) =>
                        handleUpdateLink(index, { enabled })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteLink(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {links.length === 0 && (
        <div className="py-6 text-center text-muted-foreground border-2 border-dashed rounded-lg">
          <p className="text-sm">No social links yet</p>
          <Button onClick={handleAddLink} variant="link" className="mt-1 text-sm">
            Add your first link
          </Button>
        </div>
      )}
    </div>
  );
};

export default SocialLinksEditor;
