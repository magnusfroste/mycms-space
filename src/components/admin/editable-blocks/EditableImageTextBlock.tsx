// ============================================
// Editable Image + Text Block
// Inline editing for image/text sections
// ============================================

import React from 'react';
import { cn } from '@/lib/utils';
import { Image as ImageIcon } from 'lucide-react';
import EditableText from './EditableText';

interface ImageTextBlockConfig {
  title?: string;
  content?: string;
  image_url?: string;
  image_position?: 'left' | 'right';
  background?: 'default' | 'muted' | 'card';
}

interface EditableImageTextBlockProps {
  blockId: string;
  config: Record<string, unknown>;
  isEditMode: boolean;
  onChange: (config: Record<string, unknown>) => void;
}

const EditableImageTextBlock: React.FC<EditableImageTextBlockProps> = ({
  blockId,
  config,
  isEditMode,
  onChange,
}) => {
  const typedConfig = config as ImageTextBlockConfig;
  const {
    title = '',
    content = '',
    image_url = '',
    image_position = 'left',
    background = 'default',
  } = typedConfig;

  const backgroundClasses = {
    default: 'bg-background',
    muted: 'bg-muted/50',
    card: 'bg-card',
  };

  const imageOrder = image_position === 'right' ? 'md:order-2' : '';
  const textOrder = image_position === 'right' ? 'md:order-1' : '';

  return (
    <section className={cn('py-16', backgroundClasses[background])}>
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Image */}
          <div className={cn('relative', imageOrder)}>
            {image_url ? (
              <div className="relative group">
                <img
                  src={image_url}
                  alt={title || 'Content image'}
                  className="w-full h-auto rounded-xl shadow-lg object-cover aspect-[4/3]"
                />
                {isEditMode && (
                  <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-background p-3 rounded-lg">
                      <input
                        type="text"
                        value={image_url}
                        onChange={(e) => onChange({ ...config, image_url: e.target.value })}
                        className="bg-transparent border-b border-primary outline-none w-64 text-sm"
                        placeholder="Bild-URL..."
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div 
                className={cn(
                  "w-full aspect-[4/3] bg-muted rounded-xl flex items-center justify-center",
                  isEditMode && "cursor-pointer hover:bg-muted/80 transition-colors"
                )}
              >
                {isEditMode ? (
                  <div className="text-center p-4">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <input
                      type="text"
                      value={image_url}
                      onChange={(e) => onChange({ ...config, image_url: e.target.value })}
                      className="bg-transparent border-b border-primary outline-none w-full text-sm text-center"
                      placeholder="Klistra in bild-URL..."
                    />
                  </div>
                ) : (
                  <span className="text-muted-foreground">No image</span>
                )}
              </div>
            )}
          </div>

          {/* Text Content */}
          <div className={cn('space-y-4', textOrder)}>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              <EditableText
                value={title}
                isEditMode={isEditMode}
                onChange={(value) => onChange({ ...config, title: value })}
                placeholder="Lägg till rubrik..."
              />
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              <EditableText
                value={content}
                isEditMode={isEditMode}
                onChange={(value) => onChange({ ...config, content: value })}
                placeholder="Lägg till innehåll..."
                multiline
              />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditableImageTextBlock;
