// ============================================
// Feature List Editor
// Dynamic add/remove list for features with icon
// ============================================

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import IconPicker from './IconPicker';

export interface FeatureItem {
  text: string;
  icon: string;
}

interface FeatureListEditorProps {
  label: string;
  features: FeatureItem[];
  onChange: (features: FeatureItem[]) => void;
  maxItems?: number;
}

const FeatureListEditor: React.FC<FeatureListEditorProps> = ({
  label,
  features,
  onChange,
  maxItems = 5,
}) => {
  const handleFeatureChange = (index: number, field: keyof FeatureItem, value: string) => {
    const updated = [...features];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleAddFeature = () => {
    if (features.length < maxItems) {
      onChange([...features, { text: '', icon: 'Lightbulb' }]);
    }
  };

  const handleRemoveFeature = (index: number) => {
    if (features.length > 1) {
      onChange(features.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="space-y-3">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg"
          >
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <div className="w-32">
                  <IconPicker
                    value={feature.icon}
                    onChange={(icon) => handleFeatureChange(index, 'icon', icon)}
                  />
                </div>
                <Input
                  value={feature.text}
                  onChange={(e) => handleFeatureChange(index, 'text', e.target.value)}
                  placeholder="Feature text..."
                  className="flex-1"
                />
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => handleRemoveFeature(index)}
              disabled={features.length <= 1}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      {features.length < maxItems && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddFeature}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Lägg till {label.toLowerCase().replace('s', '')}
        </Button>
      )}
    </div>
  );
};

export default FeatureListEditor;
