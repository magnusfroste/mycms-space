// ============================================
// Footer - Studio variant
// One quiet row: copyright on the left; social links, the MCP entry point
// for AI agents and the admin link on the right.
// ============================================

import React from 'react';
import { Link } from 'react-router-dom';
import { StudioContainer } from './StudioSection';
import type { SocialLink } from '@/types/modules';

const PLATFORM_LABELS: Record<SocialLink['platform'], string> = {
  github: 'GitHub',
  linkedin: 'LinkedIn',
  twitter: 'X',
  instagram: 'Instagram',
  youtube: 'YouTube',
  custom: 'Link',
};

interface FooterStudioProps {
  copyright: string;
  socialLinks: SocialLink[];
}

const linkClass = 'text-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm';

const FooterStudio: React.FC<FooterStudioProps> = ({ copyright, socialLinks }) => (
  <footer className="border-t border-border/70">
    <StudioContainer className="flex flex-wrap items-center gap-x-5 gap-y-3 py-7 text-[13px] text-muted-foreground">
      <span>{copyright}</span>
      <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-[18px] gap-y-2 sm:ml-auto">
        {socialLinks.map((link, index) => (
          <a key={`${link.platform}-${index}`} href={link.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
            {link.label || PLATFORM_LABELS[link.platform] || link.platform}
          </a>
        ))}
        <a href="/llms.txt" className={linkClass} title="llms.txt and the MCP server manifest (/mcp.json)">
          For AI agents (MCP)
        </a>
        <Link to="/admin" className="text-muted-foreground/70 transition-colors hover:text-foreground">
          Admin
        </Link>
      </nav>
    </StudioContainer>
  </footer>
);

export default FooterStudio;
