// ============================================
// CV Agent Block Editor
// Admin config for the CV Agent CTA block
// ============================================

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CvAgentConfig {
  title?: string;
  subtitle?: string;
  badge_text?: string;
  button_text?: string;
  placeholder?: string;
  features?: string[];
}

interface CvAgentBlockEditorProps {
  config: CvAgentConfig;
  onChange: (config: CvAgentConfig) => void;
}

const CvAgentBlockEditor: React.FC<CvAgentBlockEditorProps> = ({ config, onChange }) => {
  const updateConfig = (updates: Partial<CvAgentConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="badge_text">Badge Text</Label>
        <Input
          id="badge_text"
          value={config.badge_text || ''}
          onChange={(e) => updateConfig({ badge_text: e.target.value })}
          placeholder="AI-Powered"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={config.title || ''}
          onChange={(e) => updateConfig({ title: e.target.value })}
          placeholder="Is Magnus the Right Fit?"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subtitle">Subtitle</Label>
        <Textarea
          id="subtitle"
          value={config.subtitle || ''}
          onChange={(e) => updateConfig({ subtitle: e.target.value })}
          placeholder="Paste a job description and let Magnet analyze the match..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="button_text">Button Text</Label>
        <Input
          id="button_text"
          value={config.button_text || ''}
          onChange={(e) => updateConfig({ button_text: e.target.value })}
          placeholder="Analyze Match"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="placeholder">Textarea Placeholder</Label>
        <Input
          id="placeholder"
          value={config.placeholder || ''}
          onChange={(e) => updateConfig({ placeholder: e.target.value })}
          placeholder="Paste the job description here..."
        />
      </div>
    </div>
  );
};

export default CvAgentBlockEditor;
