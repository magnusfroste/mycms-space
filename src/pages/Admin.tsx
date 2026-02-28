import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Login } from '@/components/admin/Login';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { usePages } from '@/models/pages';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy-loaded admin tabs
const AnalyticsDashboard = lazy(() => import('@/components/admin/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));
const ClassicPageBuilder = lazy(() => import('@/components/admin/ClassicPageBuilder'));
const BlogManager = lazy(() => import('@/components/admin/BlogManager'));
const NavSettings = lazy(() => import('@/components/admin/NavSettings').then(m => ({ default: m.NavSettings })));
const MessagesManager = lazy(() => import('@/components/admin/MessagesManager'));
const GlobalBlocksSettings = lazy(() => import('@/components/admin/GlobalBlocksSettings'));
const BrandingSettings = lazy(() => import('@/components/admin/BrandingSettings'));
const IntegrationsManager = lazy(() => import('@/components/admin/IntegrationsManager'));
const WebhooksManager = lazy(() => import('@/components/admin/WebhooksManager'));
const AIModuleSettings = lazy(() => import('@/components/admin/AIModuleSettings'));
const ProjectsModuleSettings = lazy(() => import('@/components/admin/ProjectsModuleSettings'));
const BlogModuleSettings = lazy(() => import('@/components/admin/BlogModuleSettings'));
const SEOModuleSettings = lazy(() => import('@/components/admin/SEOModuleSettings'));
const GitHubReposManager = lazy(() => import('@/components/admin/GitHubReposManager'));
const MediaHub = lazy(() => import('@/components/admin/MediaHub'));
const NewsletterManager = lazy(() => import('@/components/admin/NewsletterManager'));
const SettingsHistory = lazy(() => import('@/components/admin/SettingsHistory').then(m => ({ default: m.SettingsHistory })));
const ChatHistoryManager = lazy(() => import('@/components/admin/ChatHistoryManager'));
const ProfileSettings = lazy(() => import('@/components/admin/ProfileSettings'));
const GeneralSettings = lazy(() => import('@/components/admin/GeneralSettings'));
const LandingPageManager = lazy(() => import('@/components/admin/LandingPageManager'));
const AutopilotDashboard = lazy(() => import('@/components/admin/AutopilotDashboard'));

// Route map: tab key → lazy component
const TAB_COMPONENTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  dashboard: AnalyticsDashboard,
  pages: ClassicPageBuilder,
  blog: BlogManager,
  navigation: NavSettings,
  messages: MessagesManager,
  'global-blocks': GlobalBlocksSettings,
  branding: BrandingSettings,
  integrations: IntegrationsManager,
  webhooks: WebhooksManager,
  'ai-module': AIModuleSettings,
  'projects-module': ProjectsModuleSettings,
  'blog-module': BlogModuleSettings,
  'seo-module': SEOModuleSettings,
  'github-repos': GitHubReposManager,
  'media-hub': MediaHub,
  newsletter: NewsletterManager,
  history: SettingsHistory,
  'chat-history': ChatHistoryManager,
  profile: ProfileSettings,
  settings: GeneralSettings,
};

const AdminLoadingFallback = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-4 w-full max-w-md" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
    </div>
  </div>
);

const Admin = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading, signOut } = useAuth();
  const { data: pages = [] } = usePages();

  const tabFromUrl = searchParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const pageParam = searchParams.get('page');
    const newParams = new URLSearchParams();
    newParams.set('tab', tab);
    if (pageParam) newParams.set('page', pageParam);
    setSearchParams(newParams);
  };

  const selectedPageSlug = searchParams.get('page') || 'home';

  const handlePageSelect = (slug: string) => {
    setSearchParams({ page: slug });
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error(error.message);
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-8 w-32 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    // Landing page gets special layout with page selector
    if (activeTab === 'landing') {
      return (
        <div className="h-[calc(100vh-2rem)]">
          {pages.length > 1 && (
            <div className="flex items-center gap-2 mb-4 px-2">
              <span className="text-sm text-muted-foreground">Editing:</span>
              <select
                value={selectedPageSlug}
                onChange={(e) => handlePageSelect(e.target.value)}
                className="px-3 py-1.5 rounded-md border bg-background text-sm"
              >
                {pages.map((page) => (
                  <option key={page.id} value={page.slug}>
                    {page.title} {page.is_main_landing ? '(Home)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Suspense fallback={<AdminLoadingFallback />}>
            <LandingPageManager pageSlug={selectedPageSlug} />
          </Suspense>
        </div>
      );
    }

    // Standard tabs via route map
    const TabComponent = TAB_COMPONENTS[activeTab] || AnalyticsDashboard;
    return (
      <Suspense fallback={<AdminLoadingFallback />}>
        <TabComponent />
      </Suspense>
    );
  };

  const isImmersive = activeTab === 'landing' || activeTab === 'pages';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onLogout={handleLogout}
        />
        <SidebarInset>
          <div className={isImmersive ? 'flex-1 p-4' : 'flex-1 p-6 lg:p-8'}>
            <div className={isImmersive ? '' : 'max-w-6xl mx-auto'}>
              {renderContent()}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
