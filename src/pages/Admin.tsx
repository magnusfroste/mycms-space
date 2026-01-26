import { useNavigate } from 'react-router-dom';
import { Login } from '@/components/admin/Login';
import { WebhookSettings } from '@/components/admin/WebhookSettings';
import { QuickActionsManager } from '@/components/admin/QuickActionsManager';
import { ChatTextSettings } from '@/components/admin/ChatTextSettings';
import { NavSettings } from '@/components/admin/NavSettings';
import LandingPageManager from '@/components/admin/LandingPageManager';
import { ProjectSettings } from '@/components/admin/ProjectSettings';
import ExpertiseSettings from '@/components/admin/ExpertiseSettings';
import FeaturedSettings from '@/components/admin/FeaturedSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut, ExternalLink } from 'lucide-react';
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
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePreview}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <Tabs defaultValue="landing" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="landing">Landing Page</TabsTrigger>
            <TabsTrigger value="navigation">Navigation</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="expertise">Expertise</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="webhook">Webhook</TabsTrigger>
          </TabsList>

          <TabsContent value="landing" className="space-y-4">
            <LandingPageManager />
          </TabsContent>

          <TabsContent value="navigation" className="space-y-4">
            <NavSettings />
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <ProjectSettings />
          </TabsContent>

          <TabsContent value="expertise" className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Expertise Areas</h2>
              <p className="text-muted-foreground">
                Manage expertise areas displayed on the page
              </p>
            </div>
            <ExpertiseSettings />
          </TabsContent>

          <TabsContent value="featured" className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Featured In</h2>
              <p className="text-muted-foreground">
                Manage featured items in the carousel
              </p>
            </div>
            <FeaturedSettings />
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Chat Settings</h2>
              <p className="text-muted-foreground">
                Customize chat appearance and quick actions
              </p>
            </div>
            <ChatTextSettings />
            <QuickActionsManager />
          </TabsContent>

          <TabsContent value="webhook" className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Webhook</h2>
              <p className="text-muted-foreground">
                Configure webhook URL for chat messages
              </p>
            </div>
            <WebhookSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
