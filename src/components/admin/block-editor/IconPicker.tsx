// ============================================
// Icon Picker Component
// Searchable grid for selecting Lucide icons
// Uses Dialog instead of Popover for stability
// ============================================

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Rocket, Target, TrendingUp, BarChart, LineChart, PieChart,
  Briefcase, Building, Building2, Landmark, Award, Trophy,
  Code, Code2, Terminal, Cpu, Database, Server, Cloud,
  Monitor, Laptop, Smartphone, Tablet, Globe, Wifi,
  Lightbulb, Brain, Sparkles, Zap, Star, Flame,
  Users, User, UserCheck, UserPlus, HeartHandshake, Handshake,
  Mail, MessageSquare, MessageCircle, Phone, Video, Mic,
  Settings, Cog, Wrench, Hammer, Palette,
  Shield, ShieldCheck, Lock, Key, Eye, EyeOff,
  Search, Filter, Download, Upload, Share, ExternalLink,
  FileText, Folder, Image, Camera, BookOpen, Newspaper,
  Calendar, Clock, Timer, History, Hourglass,
  Sun, Moon, Heart, Flag, Bookmark, Tag, Layers,
  type LucideIcon,
} from 'lucide-react';

// Direct icon mapping for reliable rendering
const iconComponents: Record<string, LucideIcon> = {
  Rocket, Target, TrendingUp, BarChart, LineChart, PieChart,
  Briefcase, Building, Building2, Landmark, Award, Trophy,
  Code, Code2, Terminal, Cpu, Database, Server, Cloud,
  Monitor, Laptop, Smartphone, Tablet, Globe, Wifi,
  Lightbulb, Brain, Sparkles, Zap, Star, Flame,
  Users, User, UserCheck, UserPlus, HeartHandshake, Handshake,
  Mail, MessageSquare, MessageCircle, Phone, Video, Mic,
  Settings, Cog, Wrench, Hammer, Palette,
  Shield, ShieldCheck, Lock, Key, Eye, EyeOff,
  Search, Filter, Download, Upload, Share, ExternalLink,
  FileText, Folder, Image, Camera, BookOpen, Newspaper,
  Calendar, Clock, Timer, History, Hourglass,
  Sun, Moon, Heart, Flag, Bookmark, Tag, Layers,
};

const availableIcons = Object.keys(iconComponents);

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  disabled?: boolean;
}

const IconPicker: React.FC<IconPickerProps> = React.memo(({ value, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  // Store onChange in ref to prevent re-render issues
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const filteredIcons = useMemo(() => {
    if (!search) return availableIcons;
    const searchLower = search.toLowerCase();
    return availableIcons.filter(icon =>
      icon.toLowerCase().includes(searchLower)
    );
  }, [search]);

  const renderIcon = useCallback((iconName: string, className?: string) => {
    const IconComponent = iconComponents[iconName];
    if (!IconComponent) return null;
    return <IconComponent className={className || 'h-4 w-4'} />;
  }, []);

  const handleSelect = useCallback((iconName: string) => {
    setOpen(false);
    setSearch('');
    // Use ref to call onChange without causing re-render loop
    onChangeRef.current(iconName);
  }, []);

  const currentIcon = renderIcon(value, 'h-4 w-4');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-14 h-10 p-0 justify-center"
          disabled={disabled}
          title={value || 'Välj ikon'}
          type="button"
        >
          {currentIcon || <span className="text-xs text-muted-foreground">?</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-base">Välj ikon</DialogTitle>
        </DialogHeader>
        <div className="p-4 pt-2 space-y-3">
          <Input
            placeholder="Sök ikon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
          />
          <div className="max-h-64 overflow-y-auto">
            {filteredIcons.length > 0 ? (
              <div className="grid grid-cols-6 gap-1.5">
                {filteredIcons.map((iconName) => {
                  const isSelected = value === iconName;
                  return (
                    <Button
                      key={iconName}
                      variant="ghost"
                      size="sm"
                      type="button"
                      className={cn(
                        'h-10 w-10 p-0 flex items-center justify-center relative',
                        isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90'
                      )}
                      onClick={() => handleSelect(iconName)}
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
                Ingen ikon hittades
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

IconPicker.displayName = 'IconPicker';

export default IconPicker;
