// ============================================
// Editable Text Component
// Inline text editing with click-to-edit
// ============================================

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface EditableTextProps {
  value: string;
  isEditMode: boolean;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3';
}

const EditableText: React.FC<EditableTextProps> = ({
  value,
  isEditMode,
  onChange,
  className = '',
  placeholder = 'Klicka för att redigera...',
  multiline = false,
  as: Component = 'span',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (isEditMode) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setLocalValue(value);
      setIsEditing(false);
    }
  };

  if (!isEditMode) {
    return <Component className={className}>{value || placeholder}</Component>;
  }

  if (isEditing) {
    const inputClassName = cn(
      'bg-transparent border-b-2 border-primary outline-none w-full min-w-[100px]',
      className
    );

    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(inputClassName, 'resize-none min-h-[60px]')}
          placeholder={placeholder}
          rows={3}
        />
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={inputClassName}
        placeholder={placeholder}
      />
    );
  }

  return (
    <Component
      onClick={handleClick}
      className={cn(
        className,
        'cursor-pointer hover:outline hover:outline-2 hover:outline-primary/50 hover:outline-offset-2 rounded transition-all',
        !value && 'text-muted-foreground italic'
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {value || placeholder}
    </Component>
  );
};

export default EditableText;
