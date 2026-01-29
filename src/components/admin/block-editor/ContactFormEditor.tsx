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
        <Label htmlFor="title">Rubrik</Label>
        <Input
          id="title"
          value={config.title || ''}
          onChange={(e) => updateConfig({ title: e.target.value })}
          placeholder="Kontakta mig"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subtitle">Underrubrik</Label>
        <Textarea
          id="subtitle"
          value={config.subtitle || ''}
          onChange={(e) => updateConfig({ subtitle: e.target.value })}
          placeholder="Beskriv vad kontaktformuläret är till för..."
          rows={2}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="showSubject">Visa ämnesfält</Label>
          <p className="text-sm text-muted-foreground">
            Låt besökare ange ett ämne för sitt meddelande
          </p>
        </div>
        <Switch
          id="showSubject"
          checked={config.showSubject !== false}
          onCheckedChange={(checked) => updateConfig({ showSubject: checked })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="buttonText">Knapptext</Label>
        <Input
          id="buttonText"
          value={config.buttonText || ''}
          onChange={(e) => updateConfig({ buttonText: e.target.value })}
          placeholder="Skicka meddelande"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="successMessage">Bekräftelsemeddelande</Label>
        <Textarea
          id="successMessage"
          value={config.successMessage || ''}
          onChange={(e) => updateConfig({ successMessage: e.target.value })}
          placeholder="Tack för ditt meddelande!"
          rows={2}
        />
      </div>
    </div>
  );
};

export default ContactFormEditor;
