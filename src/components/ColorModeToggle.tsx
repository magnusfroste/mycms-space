import { Moon, Sun } from 'lucide-react';
import { useColorMode } from '@/hooks/useColorMode';
import { cn } from '@/lib/utils';

const ColorModeToggle = ({ className }: { className?: string }) => {
  const { mode, toggle } = useColorMode();

  return (
    <button
      onClick={toggle}
      className={cn(
        'p-2 rounded-lg transition-colors duration-200',
        'text-muted-foreground hover:text-foreground hover:bg-muted/50',
        className
      )}
      aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

export default ColorModeToggle;
