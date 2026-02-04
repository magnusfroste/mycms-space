// ============================================
// Skills Bar Editor
// Editor for technical skills with levels
// ============================================

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { SkillsBarBlockConfig } from '@/types/blockConfigs';

interface SkillsBarEditorProps {
  config: SkillsBarBlockConfig;
  onChange: (config: SkillsBarBlockConfig) => void;
}

type SkillItem = NonNullable<SkillsBarBlockConfig['skills']>[number];

const SkillsBarEditor: React.FC<SkillsBarEditorProps> = ({
  config,
  onChange,
}) => {
  const skills = config.skills || [];

  const handleAddSkill = () => {
    const newSkill: SkillItem = {
      id: crypto.randomUUID(),
      name: 'New Skill',
      level: 80,
      category: '',
      enabled: true,
    };
    onChange({ ...config, skills: [...skills, newSkill] });
  };

  const handleUpdateSkill = (id: string, updates: Partial<SkillItem>) => {
    const updatedSkills = skills.map((skill) =>
      skill.id === id ? { ...skill, ...updates } : skill
    );
    onChange({ ...config, skills: updatedSkills });
  };

  const handleDeleteSkill = (id: string) => {
    onChange({ ...config, skills: skills.filter((skill) => skill.id !== id) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">
          Skills ({skills.length})
        </Label>
        <Button onClick={handleAddSkill} size="sm" variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <div className="space-y-3">
        {skills.map((skill) => (
          <Card key={skill.id} className="relative">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Drag handle placeholder */}
                <div className="mt-2 cursor-grab text-muted-foreground">
                  <GripVertical className="h-5 w-5" />
                </div>

                <div className="flex-1 space-y-3">
                  {/* Header row */}
                  <div className="flex items-center gap-3">
                    <Input
                      value={skill.name}
                      onChange={(e) =>
                        handleUpdateSkill(skill.id, { name: e.target.value })
                      }
                      placeholder="Skill name"
                      className="flex-1 font-medium"
                    />
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={skill.enabled}
                        onCheckedChange={(enabled) =>
                          handleUpdateSkill(skill.id, { enabled })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteSkill(skill.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Category */}
                  <Input
                    value={skill.category || ''}
                    onChange={(e) =>
                      handleUpdateSkill(skill.id, { category: e.target.value })
                    }
                    placeholder="Category (optional, e.g. Frontend)"
                    className="text-sm"
                  />

                  {/* Level slider */}
                  <div className="flex items-center gap-4">
                    <Label className="text-sm text-muted-foreground w-12">
                      {skill.level}%
                    </Label>
                    <Slider
                      value={[skill.level]}
                      onValueChange={([level]) =>
                        handleUpdateSkill(skill.id, { level })
                      }
                      min={0}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {skills.length === 0 && (
        <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
          <p>No skills yet</p>
          <Button onClick={handleAddSkill} variant="link" className="mt-2">
            Add your first skill
          </Button>
        </div>
      )}
    </div>
  );
};

export default SkillsBarEditor;
