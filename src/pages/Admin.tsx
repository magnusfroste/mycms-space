import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Login } from '@/components/admin/Login';
import { WebhookSettings } from '@/components/admin/WebhookSettings';
import { QuickActionsManager } from '@/components/admin/QuickActionsManager';
import { ChatTextSettings } from '@/components/admin/ChatTextSettings';
import { NavSettings } from '@/components/admin/NavSettings';
import LandingPageManager from '@/components/admin/LandingPageManager';
import PageManager from '@/components/admin/PageManager';
import { ProjectSettings } from '@/components/admin/ProjectSettings';
import ExpertiseSettings from '@/components/admin/ExpertiseSettings';
import FeaturedSettings from '@/components/admin/FeaturedSettings';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
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
  const [activeTab, setActiveTab] = useState('dashboard');
  
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
    switch (activeTab) {
      case 'dashboard':
        return <AnalyticsDashboard />;
      case 'pages':
        return <PageManager />;
      case 'landing':
        return (
          <div className="space-y-4">
            {pages.length > 1 && (
              <div className="flex items-center gap-2 mb-4">
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
      case 'navigation':
        return <NavSettings />;
      case 'projects':
        return <ProjectSettings />;
      case 'expertise':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Expertise Areas</h2>
              <p className="text-muted-foreground">
                Manage expertise areas displayed on the page
              </p>
            </div>
            <ExpertiseSettings />
          </div>
        );
      case 'featured':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Featured In</h2>
              <p className="text-muted-foreground">
                Manage featured items in the carousel
              </p>
            </div>
            <FeaturedSettings />
          </div>
        );
      case 'chat':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Chat Settings</h2>
              <p className="text-muted-foreground">
                Customize chat appearance and quick actions
              </p>
            </div>
            <ChatTextSettings />
            <QuickActionsManager />
          </div>
        );
      case 'webhook':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Webhook</h2>
              <p className="text-muted-foreground">
                Configure webhook URL for chat messages
              </p>
            </div>
            <WebhookSettings />
          </div>
        );
      default:
        return <AnalyticsDashboard />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          onLogout={handleLogout}
          onPreview={handlePreview}
        />
        <SidebarInset>
          <div className="flex-1 p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
              {renderContent()}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
