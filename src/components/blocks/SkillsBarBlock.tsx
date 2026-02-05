// ============================================
// Skills Bar Block - 2026 Design System
// Dedicated block for technical competencies
// Unified theme system compatible
// ============================================

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import type { SkillsBarBlockConfig } from '@/types/blockConfigs';

interface SkillsBarBlockProps {
  config: Record<string, unknown>;
}

const SkillsBarBlock: React.FC<SkillsBarBlockProps> = ({ config }) => {
  const typedConfig = config as SkillsBarBlockConfig;
  
  const title = typedConfig.title || 'Skills & Technologies';
  const subtitle = typedConfig.subtitle;
  const layout = typedConfig.layout || 'bars';
  const skills = typedConfig.skills?.filter(skill => skill.enabled) || [];

  const isLoading = !typedConfig.skills;

  // Group skills by category
  const groupedSkills = skills.reduce((acc, skill) => {
    const category = skill.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, typeof skills>);

  const categories = Object.keys(groupedSkills);

  return (
    <section id="skills" className="section-container relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/20 to-transparent" />
      
      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block text-sm font-medium text-primary uppercase tracking-widest mb-4 animate-fade-in">
            Skills
          </span>
          <h2 
            className="section-title animate-fade-in" 
            style={{ animationDelay: '0.1s' }}
          >
            {title}
          </h2>
          {subtitle && (
            <p 
              className="section-subtitle mt-4 animate-fade-in"
              style={{ animationDelay: '0.2s' }}
            >
              {subtitle}
            </p>
          )}
        </div>
        
        {isLoading ? (
          <div className="space-y-4 max-w-2xl mx-auto">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : layout === 'bars' ? (
          // Progress bars layout
          <div className="max-w-3xl mx-auto space-y-10">
            {categories.map((category, catIndex) => (
              <div 
                key={category} 
                className="animate-fade-in"
                style={{ animationDelay: `${0.1 + catIndex * 0.1}s` }}
              >
                {categories.length > 1 && (
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                    {category}
                  </h3>
                )}
                <div className="space-y-4">
                  {groupedSkills[category].map((skill) => (
                    <div key={skill.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{skill.name}</span>
                        <span className="text-xs text-muted-foreground">{skill.level}%</span>
                      </div>
                      <Progress value={skill.level} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : layout === 'tags' ? (
          // Tags layout
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {skills.map((skill, index) => (
              <div 
                key={skill.id}
                className="px-4 py-2 rounded-full bg-muted/50 hover:bg-primary/10 transition-colors animate-fade-in"
                style={{ animationDelay: `${0.05 + index * 0.03}s` }}
              >
                <span className="text-sm font-medium">{skill.name}</span>
                {skill.level >= 80 && (
                  <span className="ml-2 text-xs text-primary">★</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          // Compact layout - grouped by category in columns
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {categories.map((category, catIndex) => (
              <div 
                key={category}
                className="animate-fade-in"
                style={{ animationDelay: `${0.1 + catIndex * 0.1}s` }}
              >
                <h3 className="text-sm font-medium text-primary uppercase tracking-wide mb-3">
                  {category}
                </h3>
                <ul className="space-y-2">
                  {groupedSkills[category].map((skill) => (
                    <li key={skill.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-primary/60" />
                      {skill.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default SkillsBarBlock;
