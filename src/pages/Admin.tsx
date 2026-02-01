import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Login } from '@/components/admin/Login';
import AIModuleSettings from '@/components/admin/AIModuleSettings';
import ProjectsModuleSettings from '@/components/admin/ProjectsModuleSettings';
import BlogModuleSettings from '@/components/admin/BlogModuleSettings';
import BlogManager from '@/components/admin/BlogManager';
import GlobalBlocksSettings from '@/components/admin/GlobalBlocksSettings';
import IntegrationsManager from '@/components/admin/IntegrationsManager';
import { NavSettings } from '@/components/admin/NavSettings';
import LandingPageManager from '@/components/admin/LandingPageManager';
import ClassicPageBuilder from '@/components/admin/ClassicPageBuilder';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import MessagesManager from '@/components/admin/MessagesManager';
import { SettingsHistory } from '@/components/admin/SettingsHistory';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { usePages } from '@/models/pages';

const Admin = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const { data: pages = [] } = usePages();
  
  // Read active tab from URL, default to dashboard
  const tabFromUrl = searchParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  
  // Sync activeTab when URL changes (e.g., on refresh or back/forward)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);
  
  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const pageParam = searchParams.get('page');
    const newParams = new URLSearchParams();
    newParams.set('tab', tab);
    if (pageParam) newParams.set('page', pageParam);
    setSearchParams(newParams);
  };
  
  // Get selected page from URL or default to first page
  const selectedPageSlug = searchParams.get('page') || 'home';
  
  const handlePageSelect = (slug: string) => {
    setSearchParams({ page: slug });
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      navigate('/');
    }
  };

  const handlePreview = () => {
    window.open('/', '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    // Sidbyggaren gets immersive full-width layout
    if (activeTab === 'landing') {
      return (
        <div className="h-[calc(100vh-2rem)]">
          {pages.length > 1 && (
            <div className="flex items-center gap-2 mb-4 px-2">
              <span className="text-sm text-muted-foreground">Redigerar:</span>
              <select
                value={selectedPageSlug}
                onChange={(e) => handlePageSelect(e.target.value)}
                className="px-3 py-1.5 rounded-md border bg-background text-sm"
              >
                {pages.map((page) => (
                  <option key={page.id} value={page.slug}>
                    {page.title} {page.is_main_landing ? '(Startsida)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          <LandingPageManager pageSlug={selectedPageSlug} />
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <AnalyticsDashboard />;
      case 'pages':
        return <ClassicPageBuilder />;
      case 'blog':
        return <BlogManager />;
      case 'navigation':
        return <NavSettings />;
      case 'messages':
        return <MessagesManager />;
      case 'global-blocks':
        return <GlobalBlocksSettings />;
      case 'integrations':
        return <IntegrationsManager />;
      case 'ai-module':
        return <AIModuleSettings />;
      case 'projects-module':
        return <ProjectsModuleSettings />;
      case 'blog-module':
        return <BlogModuleSettings />;
      case 'history':
        return <SettingsHistory />;
      default:
        return <AnalyticsDashboard />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          onLogout={handleLogout}
          onPreview={handlePreview}
        />
        <SidebarInset>
          <div className={activeTab === 'landing' || activeTab === 'pages' ? 'flex-1 p-4' : 'flex-1 p-6 lg:p-8'}>
            <div className={activeTab === 'landing' || activeTab === 'pages' ? '' : 'max-w-6xl mx-auto'}>
              {renderContent()}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
