// ============================================
// Skill List Editor
// Dynamic add/remove list for skills with title, description, icon
// ============================================

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import { RichTextEditor } from '@/components/common';
import IconPicker from './IconPicker';

export interface SkillItem {
  title: string;
  description: string;
  icon: string;
}

interface SkillListEditorProps {
  label: string;
  skills: SkillItem[];
  onChange: (skills: SkillItem[]) => void;
  maxItems?: number;
}

const SkillListEditor: React.FC<SkillListEditorProps> = ({
  label,
  skills,
  onChange,
  maxItems = 5,
}) => {
  const handleSkillChange = (index: number, field: keyof SkillItem, value: string) => {
    const updated = [...skills];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleAddSkill = () => {
    if (skills.length < maxItems) {
      onChange([...skills, { title: '', description: '', icon: 'Lightbulb' }]);
    }
  };

  const handleRemoveSkill = (index: number) => {
    if (skills.length > 1) {
      onChange(skills.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="space-y-4">
        {skills.map((skill, index) => (
          <div
            key={index}
            className="p-4 bg-muted/50 rounded-lg space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-3">
                <div className="flex gap-2">
                  <div className="w-32 shrink-0">
                    <IconPicker
                      value={skill.icon}
                      onChange={(icon) => handleSkillChange(index, 'icon', icon)}
                    />
                  </div>
                  <Input
                    value={skill.title}
                    onChange={(e) => handleSkillChange(index, 'title', e.target.value)}
                    placeholder="Titel..."
                    className="flex-1"
                  />
                </div>
                <RichTextEditor
                  value={skill.description}
                  onChange={(value) => handleSkillChange(index, 'description', value)}
                  title={skill.title}
                  placeholder="Beskrivning..."
                  minHeight="min-h-[80px]"
                  showAI
                  aiMode="text"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => handleRemoveSkill(index)}
                disabled={skills.length <= 1}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      {skills.length < maxItems && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddSkill}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Lägg till kompetens
        </Button>
      )}
    </div>
  );
};

export default SkillListEditor;
