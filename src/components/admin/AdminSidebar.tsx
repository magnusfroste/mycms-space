import { 
  LayoutDashboard, 
  FileText, 
  Layers, 
  Navigation, 
  Bot,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LogOut,
  Mail,
  History,
  Globe,
  PenSquare,
  BookOpen,
  Plug,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  onPreview: () => void;
}

const mainNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pages', label: 'Pages', icon: FileText },
  { id: 'landing', label: 'Page Builder', icon: Layers },
  { id: 'blog', label: 'Blog', icon: PenSquare },
  { id: 'navigation', label: 'Navigation', icon: Navigation },
  { id: 'messages', label: 'Messages', icon: Mail },
];

const settingsNavItems = [
  { id: 'global-blocks', label: 'Global Blocks', icon: Globe },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'ai-module', label: 'AI Chat', icon: Bot },
  { id: 'projects-module', label: 'Projects Module', icon: FolderOpen },
  { id: 'blog-module', label: 'Blog Settings', icon: BookOpen },
  { id: 'history', label: 'History', icon: History },
];

export function AdminSidebar({ activeTab, onTabChange, onLogout, onPreview }: AdminSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-between p-2">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-sidebar-foreground">Admin</h2>
          )}
          <SidebarTrigger className="ml-auto">
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </SidebarTrigger>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.id)}
                    isActive={activeTab === item.id}
                    tooltip={item.label}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.id)}
                    isActive={activeTab === item.id}
                    tooltip={item.label}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onPreview} tooltip="Preview">
              <ExternalLink className="h-4 w-4" />
              <span>Preview</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onLogout} tooltip="Log out">
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
