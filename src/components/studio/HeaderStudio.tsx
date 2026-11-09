// ============================================
// Header - Studio variant
// Solid bar with hairline border: logo, nav links (on every page),
// colour-mode toggle and a black "Contact" pill that is always visible.
// ============================================

import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ExternalLink, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import ColorModeToggle from '@/components/ColorModeToggle';
import SmartLink from './SmartLink';
import { StudioContainer } from './StudioSection';
import type { HeaderModuleConfig } from '@/types/modules';

interface NavItem {
  label: string;
  url: string;
  is_external: boolean;
}

interface HeaderStudioProps {
  navLinks: NavItem[];
  headerConfig?: HeaderModuleConfig;
  onNavigate?: () => void;
}

const HeaderStudio: React.FC<HeaderStudioProps> = ({ navLinks, headerConfig, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();
  const isContactPage = pathname === '/contact';

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const isActive = (url: string) => url.startsWith('/') && url !== '/' && pathname.startsWith(url);

  const renderLink = (link: NavItem, mobile = false) => {
    const className = cn(
      'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm',
      mobile
        ? 'block py-2.5 text-[16px] font-medium text-foreground'
        : 'text-[14px] text-foreground/70 hover:text-foreground',
      !mobile && isActive(link.url) && 'text-foreground'
    );
    const handleClick = () => {
      onNavigate?.();
      if (mobile) setIsOpen(false);
    };
    return (
      <SmartLink
        key={link.url}
        href={link.url}
        className={className}
        onClick={handleClick}
        aria-current={isActive(link.url) ? 'page' : undefined}
      >
        {link.label}
        {link.is_external && <ExternalLink size={12} className="ml-1 inline opacity-50" aria-hidden="true" />}
      </SmartLink>
    );
  };

  const contactPill = (
    <Link
      to="/contact"
      onClick={onNavigate}
      aria-current={isContactPage ? 'page' : undefined}
      className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-[14px] font-medium text-primary-foreground transition-colors hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      Contact
    </Link>
  );

  return (
    <header
      className={cn(
        headerConfig?.sticky !== false ? 'sticky' : 'relative',
        'top-0 z-50 border-b border-border/70 bg-background'
      )}
    >
      <StudioContainer className="flex h-16 items-center gap-7">
        <Link
          to="/"
          onClick={onNavigate}
          className="shrink-0 text-[15px] font-bold tracking-[-0.01em] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          {headerConfig?.logo_image_url ? (
            <img src={headerConfig.logo_image_url} alt={headerConfig.logo_text || 'Logo'} className="h-7 w-auto" />
          ) : (
            headerConfig?.logo_text || 'froste.eu'
          )}
        </Link>

        {navLinks.length > 0 && (
          <nav aria-label="Main" className="hidden items-center gap-[22px] md:flex">
            {navLinks.map((link) => renderLink(link))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <ColorModeToggle />
          {contactPill}
          {navLinks.length > 0 && (
            <button
              type="button"
              className="-mr-1.5 inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted md:hidden"
              onClick={() => setIsOpen((open) => !open)}
              aria-expanded={isOpen}
              aria-controls="studio-mobile-nav"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              {isOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
        </div>
      </StudioContainer>

      {isOpen && (
        <nav id="studio-mobile-nav" aria-label="Main" className="border-t border-border/70 md:hidden">
          <StudioContainer className="py-3">{navLinks.map((link) => renderLink(link, true))}</StudioContainer>
        </nav>
      )}
    </header>
  );
};

export default HeaderStudio;
