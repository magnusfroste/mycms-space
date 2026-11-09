import { lazy, Suspense, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Login } from '@/components/admin/Login';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopBar } from '@/components/admin/shell/AdminTopBar';
import { resolveAdminRoute, type AdminViewId } from '@/components/admin/shell/nav';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';

// Lazy-loaded views, one per sidebar entry
const views: Record<AdminViewId, React.LazyExoticComponent<React.ComponentType<{ section?: string }>>> = {
  overview: lazy(() => import('@/components/admin/views/OverviewView')),
  review: lazy(() => import('@/components/admin/views/ReviewQueueView')),
  agents: lazy(() => import('@/components/admin/views/AgentsView')),
  magnet: lazy(() => import('@/components/admin/AIModuleSettings')),
  knowledge: lazy(() => import('@/components/admin/KnowledgeBaseManager')),
  blog: lazy(() => import('@/components/admin/BlogManager')),
  projects: lazy(() => import('@/components/admin/views/ProjectsView')),
  pages: lazy(() => import('@/components/admin/views/PagesView')),
  media: lazy(() => import('@/components/admin/MediaHub')),
  newsletter: lazy(() => import('@/components/admin/NewsletterManager')),
  inbox: lazy(() => import('@/components/admin/MessagesManager')),
  conversations: lazy(() => import('@/components/admin/ChatHistoryManager')),
  analytics: lazy(() => import('@/components/admin/AnalyticsDashboard').then((m) => ({ default: m.AnalyticsDashboard }))),
  integrations: lazy(() => import('@/components/admin/IntegrationsManager')),
  modules: lazy(() => import('@/components/admin/ModulesManager')),
  'site-settings': lazy(() => import('@/components/admin/views/SiteSettingsView')),
  activity: lazy(() => import('@/components/admin/views/ActivityView')),
  chat: lazy(() => import('@/components/admin/MagnetChat')),
};

const ViewFallback = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-4 w-full max-w-md" />
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
    </div>
  </div>
);

/**
 * The admin always uses the calm "studio" theme, whatever theme the public site
 * has. The previous value is restored when leaving the admin.
 * The violet accent is reserved for links and focus, so hover states that use
 * `bg-accent` (shadcn ghost buttons, menu items) fall back to the neutral secondary.
 */
function useStudioTheme() {
  useEffect(() => {
    const root = document.documentElement;
    const previousTheme = root.getAttribute('data-theme');
    const previousAccent = root.style.getPropertyValue('--accent');
    const previousAccentFg = root.style.getPropertyValue('--accent-foreground');
    root.setAttribute('data-theme', 'studio');
    root.style.setProperty('--accent', 'var(--secondary)');
    root.style.setProperty('--accent-foreground', 'var(--secondary-foreground)');
    return () => {
      if (previousTheme) root.setAttribute('data-theme', previousTheme);
      else root.removeAttribute('data-theme');
      if (previousAccent) root.style.setProperty('--accent', previousAccent);
      else root.style.removeProperty('--accent');
      if (previousAccentFg) root.style.setProperty('--accent-foreground', previousAccentFg);
      else root.style.removeProperty('--accent-foreground');
    };
  }, []);
}

const Admin = () => {
  useStudioTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading, signOut } = useAuth();

  const { view, section } = resolveAdminRoute(searchParams.get('tab'), searchParams.get('section'));

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) toast.error(error.message);
    else navigate('/');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-4 px-4">
          <Skeleton className="mx-auto h-8 w-32" />
          <Skeleton className="mx-auto h-4 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  const View = views[view];

  return (
    <SidebarProvider className="flex-col bg-background font-['Inter',ui-sans-serif,system-ui,sans-serif] text-foreground">
      <AdminTopBar user={user} activeView={view} onSignOut={handleLogout} />
      {view === 'chat' ? (
        <div className="h-[calc(100svh-52px)] w-full overflow-hidden">
          <Suspense fallback={<div className="p-8"><ViewFallback /></div>}>
            <View />
          </Suspense>
        </div>
      ) : (
        <div className="flex w-full flex-1">
          <AdminSidebar activeView={view} />
          {/*
            The arbitrary variants calm down the shadcn Cards used inside the older settings
            forms (big titles, drop shadows) so every view reads as one admin.
          */}
          <main
            className={[
              'min-w-0 flex-1 px-4 pb-12 pt-6 sm:px-6 lg:px-10 lg:pt-8',
              '[&_h2]:tracking-normal [&_h3]:tracking-normal',
              '[&_h3.text-2xl]:text-base [&_h3.text-2xl]:leading-snug',
              '[&_.rounded-lg.border.bg-card]:rounded-xl [&_.rounded-lg.border.bg-card]:shadow-none',
            ].join(' ')}
          >
            <div className="mx-auto max-w-[1120px]">
              <Suspense fallback={<ViewFallback />}>
                <View key={view} section={section} />
              </Suspense>
            </div>
          </main>
        </div>
      )}
    </SidebarProvider>
  );
};

export default Admin;
