// ============================================
// TechBadge Component
// Visual badge with icon for tech stack items
// ============================================

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getTechStackEntry } from '@/lib/constants/techStackIcons';
import { cn } from '@/lib/utils';

interface TechBadgeProps {
  name: string;
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
  showDot?: boolean;
}

const TechBadge: React.FC<TechBadgeProps> = ({
  name,
  variant = 'secondary',
  className,
  showDot = true,
}) => {
  const { icon: Icon, color } = getTechStackEntry(name);

  return (
    <Badge
      variant={variant}
      className={cn('flex items-center gap-1.5 font-medium', className)}
    >
      {showDot && color ? (
        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', color)} />
      ) : (
        <Icon className="w-3 h-3 flex-shrink-0" />
      )}
      {name}
    </Badge>
  );
};

export default TechBadge;
