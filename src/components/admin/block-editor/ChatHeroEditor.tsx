// ============================================
// Chat Hero Block Editor
// Admin configuration for chat-hero block
// ============================================

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import IconPicker from './IconPicker';
import type { ChatHeroBlockConfig } from '@/types/blockConfigs';
import type { QuickActionConfig } from '@/components/chat/types';

interface ChatHeroEditorProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

const ChatHeroEditor: React.FC<ChatHeroEditorProps> = ({ config, onChange }) => {
  const typedConfig = config as ChatHeroBlockConfig;

  const updateConfig = (key: keyof ChatHeroBlockConfig, value: unknown) => {
    onChange({ ...config, [key]: value });
  };

  const quickActions = typedConfig.quick_actions || [];
  const greetingMessages = typedConfig.greeting_messages || [];

  // --- Quick Actions ---
  const addQuickAction = () => {
    const newAction: QuickActionConfig = {
      id: crypto.randomUUID(),
      label: 'New Action',
      message: 'Tell me more about this',
      icon: 'MessageCircle',
      order_index: quickActions.length,
      enabled: true,
    };
    updateConfig('quick_actions', [...quickActions, newAction]);
  };

  const updateQuickAction = (index: number, field: keyof QuickActionConfig, value: unknown) => {
    const updated = [...quickActions];
    updated[index] = { ...updated[index], [field]: value };
    updateConfig('quick_actions', updated);
  };

  const removeQuickAction = (index: number) => {
    updateConfig('quick_actions', quickActions.filter((_, i) => i !== index));
  };

  // --- Greeting Messages ---
  const addGreeting = () => {
    updateConfig('greeting_messages', [...greetingMessages, 'Hello! How can I help you?']);
  };

  const updateGreeting = (index: number, value: string) => {
    const updated = [...greetingMessages];
    updated[index] = value;
    updateConfig('greeting_messages', updated);
  };

  const removeGreeting = (index: number) => {
    updateConfig('greeting_messages', greetingMessages.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Agent Identity */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground border-b pb-2">Agent Identity</h3>

        <div className="space-y-2">
          <Label htmlFor="agent_name">Agent Name</Label>
          <Input id="agent_name" value={typedConfig.agent_name || ''} onChange={(e) => updateConfig('agent_name', e.target.value)} placeholder="Magnet" />
          <p className="text-xs text-muted-foreground">The name displayed as the headline</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="agent_tagline">Tagline (fallback)</Label>
          <Input id="agent_tagline" value={typedConfig.agent_tagline || ''} onChange={(e) => updateConfig('agent_tagline', e.target.value)} placeholder="Magnus digital twin" />
          <p className="text-xs text-muted-foreground">Used if no greeting messages are set</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="welcome_badge">Welcome Badge</Label>
          <Input id="welcome_badge" value={typedConfig.welcome_badge || ''} onChange={(e) => updateConfig('welcome_badge', e.target.value)} placeholder="Welcome" />
        </div>
      </div>

      {/* Typewriter Greeting */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Typewriter Greeting</h3>
          <Button variant="outline" size="sm" onClick={addGreeting}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        {greetingMessages.map((msg, index) => (
          <div key={index} className="flex items-start gap-2">
            <Textarea
              value={msg}
              onChange={(e) => updateGreeting(index, e.target.value)}
              placeholder="Hi! I'm your AI assistant..."
              className="min-h-[60px] text-sm flex-1"
            />
            <Button variant="ghost" size="icon" onClick={() => removeGreeting(index)} className="h-8 w-8 text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {greetingMessages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">No greeting messages. The tagline will be used instead.</p>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Typing Speed</Label>
            <span className="text-xs text-muted-foreground">{typedConfig.typewriter_speed || 40}ms/char</span>
          </div>
          <Slider
            value={[typedConfig.typewriter_speed || 40]}
            onValueChange={([v]) => updateConfig('typewriter_speed', v)}
            min={15}
            max={100}
            step={5}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Keystroke Sound</Label>
            <p className="text-xs text-muted-foreground">Subtle typing sound effect</p>
          </div>
          <Switch checked={typedConfig.enable_sound ?? false} onCheckedChange={(checked) => updateConfig('enable_sound', checked)} />
        </div>
      </div>

      {/* Visual Effects */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground border-b pb-2">Visual Effects</h3>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Animations</Label>
            <p className="text-xs text-muted-foreground">Show background animations</p>
          </div>
          <Switch checked={typedConfig.enable_animations ?? true} onCheckedChange={(checked) => updateConfig('enable_animations', checked)} />
        </div>

        <div className="space-y-2">
          <Label>Animation Style</Label>
          <Select value={typedConfig.animation_style || 'falling-stars'} onValueChange={(value) => updateConfig('animation_style', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="falling-stars">Falling Stars</SelectItem>
              <SelectItem value="particles">Particles</SelectItem>
              <SelectItem value="gradient-shift">Gradient Shift</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chat Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground border-b pb-2">Chat Settings</h3>

        <div className="space-y-2">
          <Label htmlFor="placeholder">Input Placeholder</Label>
          <Input id="placeholder" value={typedConfig.placeholder || ''} onChange={(e) => updateConfig('placeholder', e.target.value)} placeholder="Ask me anything..." />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Show Quick Actions</Label>
            <p className="text-xs text-muted-foreground">Display suggestion buttons</p>
          </div>
          <Switch checked={typedConfig.show_quick_actions ?? true} onCheckedChange={(checked) => updateConfig('show_quick_actions', checked)} />
        </div>
      </div>

      {/* Quick Actions */}
      {(typedConfig.show_quick_actions ?? true) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
            <Button variant="outline" size="sm" onClick={addQuickAction}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>

          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <div key={action.id || index} className="flex items-start gap-2 p-3 rounded-lg border bg-muted/30">
                <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-grab" />
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Label</Label>
                      <Input value={action.label} onChange={(e) => updateQuickAction(index, 'label', e.target.value)} placeholder="Button label" className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Icon</Label>
                      <IconPicker value={action.icon} onChange={(icon) => updateQuickAction(index, 'icon', icon)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Message</Label>
                    <Textarea value={action.message} onChange={(e) => updateQuickAction(index, 'message', e.target.value)} placeholder="Message to send when clicked" className="min-h-[60px] text-sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={action.enabled !== false} onCheckedChange={(checked) => updateQuickAction(index, 'enabled', checked)} />
                    <Label className="text-xs text-muted-foreground">Enabled</Label>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeQuickAction(index)} className="h-8 w-8 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {quickActions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No quick actions yet. Click "Add" to create one.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHeroEditor;
