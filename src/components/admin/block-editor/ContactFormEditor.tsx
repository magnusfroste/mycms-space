// ============================================
// Contact Form Block Editor
// ============================================

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

interface ContactFormConfig {
  title?: string;
  subtitle?: string;
  showSubject?: boolean;
  buttonText?: string;
  successMessage?: string;
}

interface ContactFormEditorProps {
  config: ContactFormConfig;
  onChange: (config: ContactFormConfig) => void;
}

const ContactFormEditor: React.FC<ContactFormEditorProps> = ({ config, onChange }) => {
  const updateConfig = (updates: Partial<ContactFormConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={config.title || ''}
          onChange={(e) => updateConfig({ title: e.target.value })}
          placeholder="Contact me"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subtitle">Subtitle</Label>
        <Textarea
          id="subtitle"
          value={config.subtitle || ''}
          onChange={(e) => updateConfig({ subtitle: e.target.value })}
          placeholder="Describe what the contact form is for..."
          rows={2}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="showSubject">Show subject field</Label>
          <p className="text-sm text-muted-foreground">
            Let visitors specify a subject for their message
          </p>
        </div>
        <Switch
          id="showSubject"
          checked={config.showSubject !== false}
          onCheckedChange={(checked) => updateConfig({ showSubject: checked })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="buttonText">Button text</Label>
        <Input
          id="buttonText"
          value={config.buttonText || ''}
          onChange={(e) => updateConfig({ buttonText: e.target.value })}
          placeholder="Send message"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="successMessage">Confirmation message</Label>
        <Textarea
          id="successMessage"
          value={config.successMessage || ''}
          onChange={(e) => updateConfig({ successMessage: e.target.value })}
          placeholder="Thank you for your message!"
          rows={2}
        />
      </div>
    </div>
  );
};

export default ContactFormEditor;
