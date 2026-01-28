// ============================================
// Chat Settings Fields
// Form fields for chat widget settings
// ============================================

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AITextEnhance from './AITextEnhance';
import type { ChatSettings } from '@/types';

interface ChatSettingsFieldsProps {
  settings: ChatSettings | undefined;
  onUpdate: (field: string, value: string) => void;
}

const ChatSettingsFields: React.FC<ChatSettingsFieldsProps> = ({ settings, onUpdate }) => {
  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
        Chat Settings
      </h4>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="initial_placeholder">Welcome Message</Label>
          <AITextEnhance
            text={settings?.initial_placeholder || ''}
            onTextChange={(value) => onUpdate('initial_placeholder', value)}
            context="welcome message for chat widget"
          />
        </div>
        <Textarea
          id="initial_placeholder"
          value={settings?.initial_placeholder || ''}
          onChange={(e) => onUpdate('initial_placeholder', e.target.value)}
          placeholder="Message shown before user sends anything..."
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="active_placeholder">Active Placeholder</Label>
          <AITextEnhance
            text={settings?.active_placeholder || ''}
            onTextChange={(value) => onUpdate('active_placeholder', value)}
            context="input placeholder for chat widget"
          />
        </div>
        <Input
          id="active_placeholder"
          value={settings?.active_placeholder || ''}
          onChange={(e) => onUpdate('active_placeholder', e.target.value)}
          placeholder="Placeholder text in input field..."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="webhook_url">Webhook URL</Label>
        <Input
          id="webhook_url"
          value={settings?.webhook_url || ''}
          onChange={(e) => onUpdate('webhook_url', e.target.value)}
          placeholder="https://..."
          type="url"
        />
      </div>
    </div>
  );
};

export default ChatSettingsFields;
