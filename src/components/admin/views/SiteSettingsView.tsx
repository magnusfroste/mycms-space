import { useMemo } from 'react';
import { NavSettings } from '@/components/admin/NavSettings';
import BrandingSettings from '@/components/admin/BrandingSettings';
import GlobalBlocksSettings from '@/components/admin/GlobalBlocksSettings';
import SEOModuleSettings from '@/components/admin/SEOModuleSettings';
import WebhooksManager from '@/components/admin/WebhooksManager';
import ChromeExtensionModuleSettings from '@/components/admin/ChromeExtensionModuleSettings';
import ProfileSettings from '@/components/admin/ProfileSettings';
import GeneralSettings from '@/components/admin/GeneralSettings';
import { AdminPageHeader } from '@/components/admin/shell/AdminPageHeader';
import { SectionTabs, type SectionTab } from '@/components/admin/shell/SectionTabs';
import { useAllModules } from '@/models/modules';
import { getHiddenSidebarItems } from '@/lib/constants/moduleRegistry';

export default function SiteSettingsView({ section }: { section?: string }) {
  const { data: modules = [] } = useAllModules();
  const hidden = useMemo(
    () => getHiddenSidebarItems(modules as Array<{ module_type: string; enabled: boolean | null }>),
    [modules],
  );

  const tabs: SectionTab[] = [
    { value: 'navigation', label: 'Navigation', content: <NavSettings /> },
    {
      value: 'appearance',
      label: 'Appearance',
      content: (
        <div className="space-y-10">
          <BrandingSettings />
          <div className="border-t border-border pt-8">
            <GlobalBlocksSettings />
          </div>
        </div>
      ),
    },
    { value: 'seo', label: 'SEO & AIEO', content: <SEOModuleSettings /> },
    { value: 'webhooks', label: 'Webhooks', content: <WebhooksManager /> },
    { value: 'chrome-extension', label: 'Chrome extension', content: <ChromeExtensionModuleSettings /> },
    {
      value: 'profile',
      label: 'Profile & API tokens',
      content: (
        <div className="space-y-10">
          <ProfileSettings />
          <div className="border-t border-border pt-8">
            <GeneralSettings />
          </div>
        </div>
      ),
    },
  ].filter((t) => !hidden.has(`site-settings:${t.value}`));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Site settings"
        description="How the site looks, how it is found and how it talks to other systems. Operators with the settings scope can change these through MCP."
      />
      <SectionTabs section={section} tabs={tabs} />
    </div>
  );
}
