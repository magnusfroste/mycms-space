// ============================================
// Skill List Editor
// Compact version: icon + title only
// ============================================

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X, GripVertical } from 'lucide-react';
import IconPicker from './IconPicker';

export interface SkillItem {
  title: string;
  description: string; // kept for backwards compatibility
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
  maxItems = 8,
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
    onChange(skills.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="space-y-2">
        {skills.map((skill, index) => (
          <div
            key={index}
            className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg group"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground/50" />
            <div className="w-24 shrink-0">
              <IconPicker
                value={skill.icon}
                onChange={(icon) => handleSkillChange(index, 'icon', icon)}
              />
            </div>
            <Input
              value={skill.title}
              onChange={(e) => handleSkillChange(index, 'title', e.target.value)}
              placeholder="Title..."
              className="flex-1 h-9"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleRemoveSkill(index)}
            >
              <X className="h-4 w-4" />
            </Button>
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
          Add
        </Button>
      )}
    </div>
  );
};

export default SkillListEditor;
