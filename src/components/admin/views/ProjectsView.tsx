import GitHubReposManager from '@/components/admin/GitHubReposManager';
import ProjectsModuleSettings from '@/components/admin/ProjectsModuleSettings';
import { AdminPageHeader } from '@/components/admin/shell/AdminPageHeader';
import { SectionTabs } from '@/components/admin/shell/SectionTabs';

export default function ProjectsView({ section }: { section?: string }) {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Projects"
        description="Your GitHub repositories, enriched by AI and shown as project pages. Magnet uses them to answer questions about your work."
      />
      <SectionTabs
        section={section}
        tabs={[
          { value: 'repos', label: 'Repositories', content: <GitHubReposManager /> },
          { value: 'settings', label: 'Settings', content: <ProjectsModuleSettings /> },
        ]}
      />
    </div>
  );
}
