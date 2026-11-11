// ============================================
// Admin top bar: logo + breadcrumb, ⌘K jump-to search, Ask Magnet,
// View site and the account menu.
// ============================================

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Moon, Search, Sun, UserCircle } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSidebar } from '@/components/ui/sidebar';
import { useColorMode } from '@/hooks/useColorMode';
import { useHeaderModule } from '@/models/modules';
import { cn } from '@/lib/utils';
import { adminNavGroups, findNavGroupLabel, findNavItem, type AdminViewId } from './nav';
import { adminHref } from './primitives';

interface AdminTopBarProps {
  user: User;
  activeView: AdminViewId;
  onSignOut: () => void;
}

// Same wordmark as the public header (header module logo_text), so the admin
// reads as part of the site; the host without "www." is the fallback.
const siteHost = typeof window !== 'undefined' ? window.location.host.replace(/^www\./, '') : '';

export function AdminTopBar({ user, activeView, onSignOut }: AdminTopBarProps) {
  const navigate = useNavigate();
  const { config: headerConfig } = useHeaderModule();
  const wordmark = headerConfig?.logo_text || siteHost || 'Admin';
  const [searchOpen, setSearchOpen] = useState(false);
  const { isMobile, toggleSidebar } = useSidebar();
  const { mode, toggle: toggleColorMode } = useColorMode();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = (view: AdminViewId) => {
    setSearchOpen(false);
    navigate(adminHref(view));
  };

  const current = findNavItem(activeView);
  const group = findNavGroupLabel(activeView);
  const initials = (user.email ?? 'admin')
    .split('@')[0]
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'AD';

  return (
    <header className="sticky top-0 z-30 flex h-[52px] shrink-0 items-center gap-3 border-b border-border bg-background px-4">
      {isMobile && (
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Open navigation"
          className="-ml-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Menu className="h-4 w-4" />
        </button>
      )}

      <Link
        to={adminHref('overview')}
        className="shrink-0 text-[15px] font-bold tracking-[-0.01em] text-foreground"
      >
        {wordmark}
      </Link>

      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-2 text-sm md:flex">
        <span className="text-border">/</span>
        <Link to={adminHref('overview')} className="text-muted-foreground hover:text-foreground">
          Admin
        </Link>
        {current && activeView !== 'overview' && (
          <>
            <span className="text-border">/</span>
            {group && <span className="hidden text-muted-foreground lg:inline">{group}</span>}
            {group && <span className="hidden text-border lg:inline">/</span>}
            <span className="truncate font-medium text-foreground">{current.label}</span>
          </>
        )}
      </nav>

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className={cn(
          'ml-2 flex h-[34px] min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 text-left',
          'max-w-[420px] text-[13.5px] text-muted-foreground transition-colors hover:border-foreground/20',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
        aria-label="Search admin"
      >
        <Search className="h-[15px] w-[15px] shrink-0" />
        <span className="flex-1 truncate">Search or jump to…</span>
        <kbd className="hidden rounded border border-border bg-background px-1.5 py-px font-mono text-[11px] sm:inline">⌘K</kbd>
      </button>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Link
          to={adminHref('chat')}
          className={cn(
            'inline-flex h-[34px] items-center gap-2 rounded-lg border border-border bg-background px-3 text-[13px] font-medium text-foreground',
            'transition-colors hover:bg-muted',
            activeView === 'chat' && 'bg-muted',
          )}
        >
          <span className="h-[7px] w-[7px] rounded-full bg-ring" />
          <span className="hidden sm:inline">Ask Magnet</span>
        </Link>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="hidden h-[34px] items-center rounded-lg px-3 text-[13px] font-medium text-foreground/80 hover:bg-muted hover:text-foreground md:inline-flex"
        >
          View site ↗
        </a>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Account menu"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-ring/10 text-xs font-semibold text-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="truncate text-[13px] font-medium">{user.email}</p>
              <p className="text-xs text-muted-foreground">Owner</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(adminHref('site-settings', 'profile'))} className="gap-2 text-[13px]">
              <UserCircle className="h-3.5 w-3.5" /> Profile & API tokens
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleColorMode} className="gap-2 text-[13px]">
              {mode === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              {mode === 'dark' ? 'Light mode' : 'Dark mode'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut} className="gap-2 text-[13px]">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Jump to a page…" />
        <CommandList>
          <CommandEmpty>No page matches.</CommandEmpty>
          {adminNavGroups.map((g) => (
            <CommandGroup key={g.label || 'top'} heading={g.label || 'General'}>
              {g.items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.label} ${item.keywords?.join(' ') ?? ''}`}
                  onSelect={() => go(item.id)}
                  className="flex flex-col items-start gap-0.5"
                >
                  <span className="text-[13.5px] font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.description}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
          <CommandGroup heading="Actions">
            <CommandItem value="ask magnet chat co-pilot" onSelect={() => go('chat')}>
              <span className="text-[13.5px] font-medium">Ask Magnet</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}

export default AdminTopBar;
