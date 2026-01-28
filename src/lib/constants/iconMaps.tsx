import React from 'react';
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
} from "lucide-react";

// All available icons with consistent styling
const iconComponentMap: Record<string, LucideIcon> = {
  // Business & Strategy
  Rocket, Target, TrendingUp, BarChart, LineChart, PieChart,
  Briefcase, Building, Building2, Landmark, Award, Trophy,
  // Tech & Development
  Code, Code2, Terminal, Cpu, Database, Server, Cloud,
  Monitor, Laptop, Smartphone, Tablet, Globe, Wifi,
  // Innovation & Ideas
  Lightbulb, Brain, Sparkles, Zap, Star, Flame,
  // People & Teams
  Users, User, UserCheck, UserPlus, HeartHandshake, Handshake,
  // Communication
  Mail, MessageSquare, MessageCircle, Phone, Video, Mic,
  // Tools & Settings
  Settings, Cog, Wrench, Hammer, Palette,
  // Security
  Shield, ShieldCheck, Lock, Key, Eye, EyeOff,
  // Navigation & Actions
  Search, Filter, Download, Upload, Share, ExternalLink,
  // Content
  FileText, Folder, Image, Camera, BookOpen, Newspaper,
  // Time & Calendar
  Calendar, Clock, Timer, History, Hourglass,
  // Nature & Misc
  Sun, Moon, Heart, Flag, Bookmark, Tag, Layers,
};

// Legacy iconMap for backward compatibility - renders icons with default styling
export const iconMap: Record<string, React.ReactNode> = Object.fromEntries(
  Object.entries(iconComponentMap).map(([name, Icon]) => [
    name,
    <Icon key={name} className="text-primary h-5 w-5" />
  ])
);

// Dynamic icon renderer function for more flexibility
export const renderIcon = (iconName: string, className?: string): React.ReactNode => {
  const IconComponent = iconComponentMap[iconName];
  if (!IconComponent) return null;
  return <IconComponent className={className || 'h-5 w-5'} />;
};

// Get list of all available icon names
export const availableIconNames = Object.keys(iconComponentMap);
