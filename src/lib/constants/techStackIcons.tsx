// ============================================
// Tech Stack Icon Mapping
// Maps technology names to Lucide icons
// Case-insensitive lookup
// ============================================

import {
  Code2,
  Terminal,
  Globe,
  Database,
  Server,
  Cpu,
  Smartphone,
  Palette,
  Shield,
  Zap,
  Box,
  FileCode,
  Cloud,
  Layers,
  Hash,
  Braces,
  type LucideIcon,
} from 'lucide-react';

export interface TechStackEntry {
  icon: LucideIcon;
  color?: string; // tailwind bg class for accent dot
}

// Mapping of lowercase tech name → icon + optional color
const techStackMap: Record<string, TechStackEntry> = {
  // Languages
  typescript: { icon: Code2, color: 'bg-blue-500' },
  javascript: { icon: Braces, color: 'bg-yellow-400' },
  python: { icon: Terminal, color: 'bg-green-500' },
  rust: { icon: Cpu, color: 'bg-orange-500' },
  go: { icon: Terminal, color: 'bg-cyan-500' },
  java: { icon: FileCode, color: 'bg-red-500' },
  ruby: { icon: Hash, color: 'bg-red-600' },
  php: { icon: FileCode, color: 'bg-purple-500' },
  swift: { icon: Smartphone, color: 'bg-orange-400' },
  html: { icon: Globe, color: 'bg-orange-600' },
  css: { icon: Palette, color: 'bg-blue-600' },
  shell: { icon: Terminal, color: 'bg-green-600' },
  vue: { icon: Layers, color: 'bg-emerald-500' },
  c: { icon: Code2, color: 'bg-gray-500' },
  'c++': { icon: Code2, color: 'bg-blue-700' },
  'c#': { icon: Code2, color: 'bg-purple-600' },
  kotlin: { icon: FileCode, color: 'bg-violet-500' },
  dart: { icon: Zap, color: 'bg-sky-500' },

  // Frameworks & Libraries
  react: { icon: Layers, color: 'bg-cyan-400' },
  'react-native': { icon: Smartphone, color: 'bg-cyan-400' },
  nextjs: { icon: Server, color: 'bg-foreground' },
  'next.js': { icon: Server, color: 'bg-foreground' },
  nodejs: { icon: Server, color: 'bg-green-600' },
  'node.js': { icon: Server, color: 'bg-green-600' },
  express: { icon: Server, color: 'bg-gray-500' },
  django: { icon: Shield, color: 'bg-green-700' },
  flask: { icon: Server, color: 'bg-gray-600' },
  tailwindcss: { icon: Palette, color: 'bg-cyan-500' },
  tailwind: { icon: Palette, color: 'bg-cyan-500' },

  // Platforms & Services
  supabase: { icon: Database, color: 'bg-emerald-500' },
  firebase: { icon: Zap, color: 'bg-amber-500' },
  aws: { icon: Cloud, color: 'bg-orange-500' },
  docker: { icon: Box, color: 'bg-blue-500' },
  vercel: { icon: Globe, color: 'bg-foreground' },
  postgresql: { icon: Database, color: 'bg-blue-700' },
  postgres: { icon: Database, color: 'bg-blue-700' },
  mongodb: { icon: Database, color: 'bg-green-600' },
  redis: { icon: Database, color: 'bg-red-500' },
  graphql: { icon: Layers, color: 'bg-pink-500' },

  // Concepts / topics
  ai: { icon: Cpu, color: 'bg-violet-500' },
  'machine-learning': { icon: Cpu, color: 'bg-violet-500' },
  api: { icon: Cloud, color: 'bg-blue-500' },
  security: { icon: Shield, color: 'bg-red-500' },
  'web-app': { icon: Globe, color: 'bg-blue-500' },
  cli: { icon: Terminal, color: 'bg-gray-600' },
  devops: { icon: Server, color: 'bg-orange-500' },
};

/**
 * Look up a tech stack entry by name (case-insensitive).
 * Returns icon + color, or a default Code2 icon.
 */
export const getTechStackEntry = (name: string): TechStackEntry => {
  const key = name.toLowerCase().trim();
  return techStackMap[key] || { icon: Code2 };
};
