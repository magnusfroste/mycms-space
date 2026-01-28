// ============================================
// Icon Picker Component
// Searchable grid for selecting Lucide icons
// ============================================

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, ChevronDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

// Curated list of commonly used icons
const availableIcons = [
  // Business & Strategy
  'Rocket', 'Target', 'TrendingUp', 'BarChart', 'LineChart', 'PieChart',
  'Briefcase', 'Building', 'Building2', 'Landmark', 'Award', 'Trophy',
  // Tech & Development
  'Code', 'Code2', 'Terminal', 'Cpu', 'Database', 'Server', 'Cloud',
  'Monitor', 'Laptop', 'Smartphone', 'Tablet', 'Globe', 'Wifi',
  // Innovation & Ideas
  'Lightbulb', 'Brain', 'Sparkles', 'Zap', 'Star', 'Flame',
  // People & Teams
  'Users', 'User', 'UserCheck', 'UserPlus', 'HeartHandshake', 'Handshake',
  // Communication
  'Mail', 'MessageSquare', 'MessageCircle', 'Phone', 'Video', 'Mic',
  // Tools & Settings
  'Settings', 'Cog', 'Wrench', 'Hammer', 'Tool', 'Palette',
  // Security
  'Shield', 'ShieldCheck', 'Lock', 'Key', 'Eye', 'EyeOff',
  // Navigation & Actions
  'Search', 'Filter', 'Download', 'Upload', 'Share', 'ExternalLink',
  // Content
  'FileText', 'Folder', 'Image', 'Camera', 'BookOpen', 'Newspaper',
  // Time & Calendar
  'Calendar', 'Clock', 'Timer', 'History', 'Hourglass',
  // Nature & Misc
  'Sun', 'Moon', 'Heart', 'Flag', 'Bookmark', 'Tag', 'Layers',
];

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  disabled?: boolean;
}

const IconPicker: React.FC<IconPickerProps> = ({ value, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredIcons = useMemo(() => {
    if (!search) return availableIcons;
    const searchLower = search.toLowerCase();
    return availableIcons.filter(icon =>
      icon.toLowerCase().includes(searchLower)
    );
  }, [search]);

  const getIconComponent = (iconName: string): React.ComponentType<{ className?: string }> | null => {
    const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    if (!IconComponent || typeof IconComponent !== 'function') return null;
    return IconComponent;
  };

  const renderIcon = (iconName: string, className?: string) => {
    const IconComponent = getIconComponent(iconName);
    if (!IconComponent) return null;
    return <IconComponent className={className || 'h-4 w-4'} />;
  };

  const currentIcon = renderIcon(value, 'h-4 w-4');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-14 h-10 p-0 justify-center"
          disabled={disabled}
          title={value || 'Välj ikon'}
        >
          {currentIcon || <span className="text-xs text-muted-foreground">?</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-popover z-[100]" align="start" sideOffset={4}>
        <div className="p-3 border-b bg-background">
          <Input
            placeholder="Sök ikon (t.ex. rocket, brain)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
            autoFocus
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-2">
          {filteredIcons.length > 0 ? (
            <div className="grid grid-cols-6 gap-1.5">
              {filteredIcons.map((iconName) => {
                const isSelected = value === iconName;
                return (
                  <Button
                    key={iconName}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-10 w-10 p-0 flex items-center justify-center relative',
                      isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90'
                    )}
                    onClick={() => {
                      onChange(iconName);
                      setOpen(false);
                      setSearch('');
                    }}
                    title={iconName}
                  >
                    {renderIcon(iconName, 'h-5 w-5')}
                    {isSelected && (
                      <Check className="h-3 w-3 absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5" />
                    )}
                  </Button>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Ingen ikon hittades för "{search}"
            </p>
          )}
        </div>
        {value && (
          <div className="p-2 border-t bg-muted/30 text-center">
            <span className="text-xs text-muted-foreground">Vald: {value}</span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default IconPicker;
