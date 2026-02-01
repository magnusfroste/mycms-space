// ============================================
// Editable Text Section Block
// Inline editing for text sections
// ============================================

import React from 'react';
import { cn } from '@/lib/utils';
import EditableText from './EditableText';

interface TextSectionBlockConfig {
  title?: string;
  content?: string;
  alignment?: 'left' | 'center' | 'right';
  background?: 'default' | 'muted' | 'card';
}

interface EditableTextSectionBlockProps {
  blockId: string;
  config: Record<string, unknown>;
  isEditMode: boolean;
  onChange: (config: Record<string, unknown>) => void;
}

const EditableTextSectionBlock: React.FC<EditableTextSectionBlockProps> = ({
  blockId,
  config,
  isEditMode,
  onChange,
}) => {
  const typedConfig = config as TextSectionBlockConfig;
  const { title = '', content = '', alignment = 'center', background = 'default' } = typedConfig;

  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const backgroundClasses = {
    default: 'bg-background',
    muted: 'bg-muted/50',
    card: 'bg-card',
  };

  return (
    <section className={cn('py-16', backgroundClasses[background])}>
      <div className="container mx-auto px-4">
        <div className={cn('max-w-3xl mx-auto', alignmentClasses[alignment])}>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            <EditableText
              value={title}
              isEditMode={isEditMode}
              onChange={(value) => onChange({ ...config, title: value })}
              placeholder="Add heading..."
            />
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground">
            <EditableText
              value={content}
              isEditMode={isEditMode}
              onChange={(value) => onChange({ ...config, content: value })}
              placeholder="Add content..."
              multiline
            />
          </p>
        </div>
      </div>
    </section>
  );
};

export default EditableTextSectionBlock;
