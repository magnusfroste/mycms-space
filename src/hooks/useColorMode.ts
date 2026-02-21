import { useState, useEffect, useCallback } from 'react';

type ColorMode = 'light' | 'dark';

const STORAGE_KEY = 'color-mode';

const getInitial = (): ColorMode => {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(STORAGE_KEY) as ColorMode | null;
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const useColorMode = () => {
  const [mode, setMode] = useState<ColorMode>(getInitial);

  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const toggle = useCallback(() => {
    setMode(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { mode, toggle, setMode };
};
