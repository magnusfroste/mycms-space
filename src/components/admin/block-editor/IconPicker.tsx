// ============================================
// Icon Picker Component
// Searchable dropdown for selecting Lucide icons
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
import { Check, Search } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

// Available icons that match our iconMap
const availableIcons = [
  'Rocket', 'BarChart', 'Brain', 'Lightbulb', 'Building',
  'LineChart', 'Layers', 'Users', 'Code', 'Zap', 'Target',
  'Monitor', 'Cpu', 'Database', 'Globe', 'Heart', 'Star',
  'Shield', 'Lock', 'Key', 'Settings', 'Cog', 'Wrench',
  'Tool', 'Hammer', 'Briefcase', 'Calendar', 'Clock',
  'Mail', 'MessageSquare', 'Phone', 'Video', 'Camera',
  'Image', 'FileText', 'Folder', 'Archive', 'Download',
  'Upload', 'Cloud', 'Server', 'Wifi', 'Bluetooth',
  'Battery', 'Power', 'Sun', 'Moon', 'Sparkles',
  'TrendingUp', 'Award', 'Trophy', 'Flag', 'Bookmark',
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
    return availableIcons.filter(icon =>
      icon.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const renderIcon = (iconName: string, className?: string) => {
    const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    if (!IconComponent || typeof IconComponent !== 'function') return null;
    return <IconComponent className={className || 'h-4 w-4'} />;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            {renderIcon(value, 'h-4 w-4 text-primary')}
            <span>{value || 'Välj ikon...'}</span>
          </div>
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 bg-popover" align="start">
        <div className="p-2 border-b">
          <Input
            placeholder="Sök ikon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        <ScrollArea className="h-64">
          <div className="grid grid-cols-4 gap-1 p-2">
            {filteredIcons.map((iconName) => (
              <Button
                key={iconName}
                variant="ghost"
                size="sm"
                className={cn(
                  'h-10 w-full flex flex-col items-center justify-center gap-1 p-1',
                  value === iconName && 'bg-primary/10 border border-primary'
                )}
                onClick={() => {
                  onChange(iconName);
                  setOpen(false);
                  setSearch('');
                }}
              >
                {renderIcon(iconName, 'h-5 w-5')}
                {value === iconName && (
                  <Check className="h-3 w-3 text-primary absolute top-0 right-0" />
                )}
              </Button>
            ))}
          </div>
          {filteredIcons.length === 0 && (
            <p className="text-center text-muted-foreground py-4 text-sm">
              Ingen ikon hittades
            </p>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default IconPicker;
