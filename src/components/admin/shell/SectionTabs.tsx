// ============================================
// Underline tabs whose active value lives in the URL (?section=…), so every
// inner tab of an admin page can be linked to and survives a reload.
// ============================================

import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { underlineTabs } from './primitives';

export interface SectionTab {
  value: string;
  label: ReactNode;
  content: ReactNode;
}

export function SectionTabs({
  tabs,
  section,
  className,
}: {
  tabs: SectionTab[];
  /** Section from the URL; falls back to the first tab. */
  section?: string;
  className?: string;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const active = tabs.some((t) => t.value === section) ? (section as string) : tabs[0]?.value;

  const onChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('section', value);
    setSearchParams(next, { replace: true });
  };

  return (
    <Tabs value={active} onValueChange={onChange} className={className}>
      <TabsList className={underlineTabs.list}>
        {tabs.map((t) => (
          <TabsTrigger key={t.value} value={t.value} className={underlineTabs.trigger}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((t) => (
        <TabsContent key={t.value} value={t.value} className="mt-6 focus-visible:outline-none">
          {t.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}

export default SectionTabs;
