// ============================================
// GitHub Block Editor
// Admin editor for GitHub block configuration
// ============================================

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Github } from 'lucide-react';
import type { GitHubBlockConfig } from '@/types/github';

interface GitHubBlockEditorProps {
  config: GitHubBlockConfig;
  onChange: (config: GitHubBlockConfig) => void;
}

const GitHubBlockEditor: React.FC<GitHubBlockEditorProps> = ({ config, onChange }) => {
  const updateConfig = (updates: Partial<GitHubBlockConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-6">
      {/* Username - Most Important */}
      <div className="p-4 bg-muted/50 rounded-lg space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Github className="w-5 h-5" />
          <Label className="text-base font-semibold">GitHub Username</Label>
        </div>
        <Input
          value={config.username || ''}
          onChange={(e) => updateConfig({ username: e.target.value })}
          placeholder="magnusfroste"
          className="text-lg"
        />
        <p className="text-xs text-muted-foreground">
          Enter your GitHub username to display your public repositories
        </p>
      </div>

      {/* Section Headers */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Section Title</Label>
          <Input
            value={config.title || ''}
            onChange={(e) => updateConfig({ title: e.target.value })}
            placeholder="Open Source Projects"
          />
        </div>
        <div className="space-y-2">
          <Label>Subtitle</Label>
          <Input
            value={config.subtitle || ''}
            onChange={(e) => updateConfig({ subtitle: e.target.value })}
            placeholder="My contributions to the open source community"
          />
        </div>
      </div>

      {/* Display Options */}
      <div className="space-y-4">
        <h4 className="font-medium">Display Options</h4>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <Label>Show Stars & Forks</Label>
            <Switch
              checked={config.showStats ?? true}
              onCheckedChange={(checked) => updateConfig({ showStats: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <Label>Show Languages</Label>
            <Switch
              checked={config.showLanguages ?? true}
              onCheckedChange={(checked) => updateConfig({ showLanguages: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <Label>Show Topics</Label>
            <Switch
              checked={config.showTopics ?? true}
              onCheckedChange={(checked) => updateConfig({ showTopics: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <Label>Show Images</Label>
            <Switch
              checked={config.showImages ?? true}
              onCheckedChange={(checked) => updateConfig({ showImages: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <Label>Show Problem Statement</Label>
            <Switch
              checked={config.showProblemStatement ?? true}
              onCheckedChange={(checked) => updateConfig({ showProblemStatement: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <Label>Show Why It Matters</Label>
            <Switch
              checked={config.showWhyItMatters ?? true}
              onCheckedChange={(checked) => updateConfig({ showWhyItMatters: checked })}
            />
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="space-y-2">
        <Label>Layout</Label>
        <Select
          value={config.layout || 'grid'}
          onValueChange={(value) => updateConfig({ layout: value as GitHubBlockConfig['layout'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="project-cards">
              <div>
                <span className="font-medium">Project Cards</span>
                <p className="text-xs text-muted-foreground">Large cards with images, problem & why it matters</p>
              </div>
            </SelectItem>
            <SelectItem value="showcase-hero">
              <div>
                <span className="font-medium">Showcase Hero</span>
                <p className="text-xs text-muted-foreground">One repo at a time with carousel navigation</p>
              </div>
            </SelectItem>
            <SelectItem value="grid">
              <div>
                <span className="font-medium">Classic Grid</span>
                <p className="text-xs text-muted-foreground">Compact cards in 3-column grid</p>
              </div>
            </SelectItem>
            <SelectItem value="minimal-list">
              <div>
                <span className="font-medium">Minimal List</span>
                <p className="text-xs text-muted-foreground">Simple list with quick links</p>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Max Repos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Number of Repositories</Label>
          <span className="text-sm font-medium text-muted-foreground">
            {config.maxRepos || 6}
          </span>
        </div>
        <Slider
          value={[config.maxRepos || 6]}
          onValueChange={([value]) => updateConfig({ maxRepos: value })}
          min={3}
          max={12}
          step={1}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          How many repositories to display (3-12)
        </p>
      </div>

      {/* Filter by Language (optional) */}
      <div className="space-y-2">
        <Label>Filter by Language (optional)</Label>
        <Input
          value={config.filterLanguage || ''}
          onChange={(e) => updateConfig({ filterLanguage: e.target.value })}
          placeholder="TypeScript, Python, etc."
        />
        <p className="text-xs text-muted-foreground">
          Leave empty to show all languages
        </p>
      </div>
    </div>
  );
};

export default GitHubBlockEditor;
