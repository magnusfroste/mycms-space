// ============================================
// Chat Widget Editor (Inline Block Editor)
// Edits block_config for chat-widget blocks
// ============================================

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import IconPicker from './IconPicker';
import type { ChatWidgetBlockConfig } from '@/types/blockConfigs';

interface ChatWidgetEditorProps {
  config: ChatWidgetBlockConfig;
  onChange: (config: ChatWidgetBlockConfig) => void;
}

const ChatWidgetEditor: React.FC<ChatWidgetEditorProps> = ({ config, onChange }) => {
  const quickActions = config.quick_actions || [];

  const handleAddAction = () => {
    const newAction = {
      id: crypto.randomUUID(),
      label: 'New Action',
      message: '',
      icon: 'MessageCircle',
      order_index: quickActions.length,
      enabled: true,
    };
    onChange({
      ...config,
      quick_actions: [...quickActions, newAction],
    });
  };

  const handleUpdateAction = (id: string, updates: Partial<typeof quickActions[0]>) => {
    onChange({
      ...config,
      quick_actions: quickActions.map(action =>
        action.id === id ? { ...action, ...updates } : action
      ),
    });
  };

  const handleDeleteAction = (id: string) => {
    onChange({
      ...config,
      quick_actions: quickActions.filter(action => action.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      {/* Title & Subtitle */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          Section Header
        </h4>
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={config.title || ''}
            onChange={(e) => onChange({ ...config, title: e.target.value })}
            placeholder="Chat with Magnet"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subtitle">Subtitle</Label>
          <Input
            id="subtitle"
            value={config.subtitle || ''}
            onChange={(e) => onChange({ ...config, subtitle: e.target.value })}
            placeholder="Ask anything about my projects or expertise"
          />
        </div>
      </div>

      {/* Placeholders */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          Chat Text
        </h4>
        <div className="space-y-2">
          <Label htmlFor="initial_placeholder">Welcome Message</Label>
          <Textarea
            id="initial_placeholder"
            value={config.initial_placeholder || ''}
            onChange={(e) => onChange({ ...config, initial_placeholder: e.target.value })}
            placeholder="Hi, I'm Magnet, Magnus agentic twin. How can I help you today?"
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            Shown before user sends first message
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="active_placeholder">Active Placeholder</Label>
          <Input
            id="active_placeholder"
            value={config.active_placeholder || ''}
            onChange={(e) => onChange({ ...config, active_placeholder: e.target.value })}
            placeholder="How can Magnet help?"
          />
          <p className="text-xs text-muted-foreground">
            Shown in input field during conversation
          </p>
        </div>
      </div>

      {/* Quick Actions Toggle */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div>
          <Label>Show Quick Actions</Label>
          <p className="text-xs text-muted-foreground">
            Display quick action buttons below chat
          </p>
        </div>
        <Switch
          checked={config.show_quick_actions ?? true}
          onCheckedChange={(checked) => onChange({ ...config, show_quick_actions: checked })}
        />
      </div>

      {/* Quick Actions List */}
      {(config.show_quick_actions ?? true) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Quick Actions
            </h4>
            <Button onClick={handleAddAction} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Add Action
            </Button>
          </div>
          
          <div className="space-y-3">
            {quickActions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                No quick actions. Click "Add Action" to create one.
              </p>
            )}
            {quickActions.map((action) => (
              <div
                key={action.id}
                className="border rounded-lg p-4 space-y-3 bg-card"
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Label</Label>
                      <Input
                        value={action.label}
                        onChange={(e) => handleUpdateAction(action.id, { label: e.target.value })}
                        placeholder="Button label"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Icon</Label>
                      <IconPicker
                        value={action.icon}
                        onChange={(icon) => handleUpdateAction(action.id, { icon })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={action.enabled}
                      onCheckedChange={(checked) => handleUpdateAction(action.id, { enabled: checked })}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDeleteAction(action.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Message (sent when clicked)</Label>
                  <Textarea
                    value={action.message}
                    onChange={(e) => handleUpdateAction(action.id, { message: e.target.value })}
                    placeholder="The message that will be sent when user clicks this button"
                    rows={2}
                    className="text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidgetEditor;
