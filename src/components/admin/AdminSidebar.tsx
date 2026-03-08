import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Layers, 
  Navigation, 
  Bot,
  Blocks,
  Zap,
  Orbit,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Mail,
  History,
  Globe,
  PenSquare,
  BookOpen,
  Plug,
  Search,
  Github,
  ImageIcon,
  Palette,
  UserCircle,
  Webhook,
  MessageSquare,
  Settings2,
  BookUser,
  X,
} from 'lucide-react';
import { useAllModules } from '@/models/modules';
import { getHiddenSidebarItems } from '@/lib/constants/moduleRegistry';
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
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

const mainNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pages', label: 'Pages', icon: FileText },
  { id: 'landing', label: 'Page Builder', icon: Layers },
  { id: 'blog', label: 'Blog', icon: PenSquare },
  { id: 'media-hub', label: 'Media Hub', icon: ImageIcon },
  { id: 'newsletter', label: 'Newsletter', icon: Mail },
  { id: 'resume', label: 'Resume', icon: BookUser },
  { id: 'agency', label: 'Agency', icon: Orbit },
  { id: 'navigation', label: 'Navigation', icon: Navigation },
  { id: 'messages', label: 'Messages', icon: Mail },
];

const settingsNavItems = [
  { id: 'modules', label: 'Modules', icon: Blocks },
  { id: 'settings', label: 'Settings', icon: Settings2 },
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'global-blocks', label: 'Global Blocks', icon: Globe },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  { id: 'chat-settings', label: 'Chat Settings', icon: Bot },
  { id: 'chat-history', label: 'Chat History', icon: MessageSquare },
  { id: 'projects-module', label: 'Projects Module', icon: FolderOpen },
  { id: 'github-repos', label: 'GitHub Repos', icon: Github },
  { id: 'blog-module', label: 'Blog Settings', icon: BookOpen },
  { id: 'seo-module', label: 'SEO & AIEO', icon: Search },
  { id: 'chrome-extension', label: 'Chrome Extension', icon: Globe },
  { id: 'history', label: 'History', icon: History },
];

const footerItems = [
  { id: 'profile', label: 'Profile', icon: UserCircle },
];

const allItems = [...mainNavItems, ...settingsNavItems, ...footerItems];

export function AdminSidebar({ activeTab, onTabChange, onLogout }: AdminSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: allModules = [] } = useAllModules();

  // Compute which sidebar items to hide based on disabled modules
  const hiddenItems = useMemo(
    () => getHiddenSidebarItems(allModules as Array<{ module_type: string; enabled: boolean | null }>),
    [allModules]
  );

  const visibleMainNav = useMemo(
    () => mainNavItems.filter((item) => !hiddenItems.has(item.id)),
    [hiddenItems]
  );
  const visibleSettingsNav = useMemo(
    () => settingsNavItems.filter((item) => !hiddenItems.has(item.id)),
    [hiddenItems]
  );

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return allItems.filter(item => item.label.toLowerCase().includes(q) || item.id.toLowerCase().includes(q));
  }, [query]);

  const handleSelect = (id: string) => {
    onTabChange(id);
    setQuery('');
    setSearchOpen(false);
  };

  const showSearch = searchOpen && !isCollapsed;

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

        {/* Search */}
        {!isCollapsed && (
          <div className="px-2 pb-2">
            {showSearch ? (
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search…"
                  className="h-8 pl-7 pr-7 text-sm bg-sidebar-accent/50"
                  autoFocus
                />
                <button
                  onClick={() => { setSearchOpen(false); setQuery(''); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setSearchOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
                className="flex items-center gap-2 w-full h-8 px-2 rounded-md text-sm text-muted-foreground hover:bg-sidebar-accent/50 transition-colors"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Search</span>
                <kbd className="ml-auto text-[10px] font-mono bg-sidebar-accent rounded px-1 py-0.5">⌘K</kbd>
              </button>
            )}
          </div>
        )}
        {isCollapsed && (
          <div className="flex justify-center pb-2">
            <button
              onClick={() => { setSearchOpen(true); }}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-sidebar-accent/50"
              title="Search (⌘K)"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {/* Search results */}
        {filteredItems !== null ? (
          <SidebarGroup>
            <SidebarGroupLabel>Results</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredItems.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground">No matches</p>
                ) : (
                  filteredItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => handleSelect(item.id)}
                        isActive={activeTab === item.id}
                        tooltip={item.label}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleMainNav.map((item) => (
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
                  {visibleSettingsNav.map((item) => (
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
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => onTabChange('profile')}
              isActive={activeTab === 'profile'}
              tooltip="Profile"
            >
              <UserCircle className="h-4 w-4" />
              <span>Profile</span>
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
