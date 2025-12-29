import { useNavigate } from 'react-router-dom';
import { Login } from '@/components/admin/Login';
import { WebhookSettings } from '@/components/admin/WebhookSettings';
import { QuickActionsManager } from '@/components/admin/QuickActionsManager';
import { ChatTextSettings } from '@/components/admin/ChatTextSettings';
import { HeroSettings } from '@/components/admin/HeroSettings';
import AboutMeSettings from '@/components/admin/AboutMeSettings';
import ExpertiseSettings from '@/components/admin/ExpertiseSettings';
import FeaturedSettings from '@/components/admin/FeaturedSettings';
import { ProjectSettings } from '@/components/admin/ProjectSettings';
import { PortfolioSettings } from '@/components/admin/PortfolioSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="webhook" className="space-y-6">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="webhook">Webhook</TabsTrigger>
            <TabsTrigger value="actions">Quick Actions</TabsTrigger>
            <TabsTrigger value="text">Chat Text</TabsTrigger>
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="about">About Me</TabsTrigger>
            <TabsTrigger value="expertise">Expertise</TabsTrigger>
            <TabsTrigger value="featured">Featured In</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
          </TabsList>

          <TabsContent value="webhook" className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Webhook Settings</h2>
              <p className="text-muted-foreground">
                Configure the webhook URL for chat message handling
              </p>
            </div>
            <WebhookSettings />
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Quick Actions</h2>
              <p className="text-muted-foreground">
                Manage quick action buttons shown in the chat interface
              </p>
            </div>
            <QuickActionsManager />
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Chat Text</h2>
              <p className="text-muted-foreground">
                Customize placeholder text for different chat states
              </p>
            </div>
            <ChatTextSettings />
          </TabsContent>

          <TabsContent value="hero" className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Hero Section</h2>
              <p className="text-muted-foreground">
                Customize hero content and animations
              </p>
            </div>
            <HeroSettings />
          </TabsContent>

          <TabsContent value="about" className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">About Me Section</h2>
              <p className="text-muted-foreground">
                Manage your personal information, bio, and skills
              </p>
            </div>
            <AboutMeSettings />
          </TabsContent>

          <TabsContent value="expertise" className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Expertise Areas</h2>
              <p className="text-muted-foreground">
                Manage your areas of expertise displayed on the homepage
              </p>
            </div>
            <ExpertiseSettings />
          </TabsContent>

          <TabsContent value="featured" className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Featured In</h2>
              <p className="text-muted-foreground">
                Manage items displayed in the Featured section
              </p>
            </div>
            <FeaturedSettings />
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Portfolio Settings</h2>
              <p className="text-muted-foreground">
                Customize the portfolio section title and settings
              </p>
            </div>
            <PortfolioSettings />
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <ProjectSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
