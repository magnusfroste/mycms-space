// ============================================
// SmartLink
// One link component for the three kinds of URLs stored in block configs:
// internal routes (/contact), in-page anchors (#github) and external URLs.
// ============================================

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { scrollToAnchor, getAnchorFallbackRoute } from '@/lib/utils/anchors';

interface SmartLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
  children: React.ReactNode;
}

const SmartLink: React.FC<SmartLinkProps> = ({ href, children, onClick, ...rest }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (/^(https?:|mailto:|tel:)/.test(href)) {
    const external = href.startsWith('http');
    return (
      <a
        href={href}
        onClick={onClick}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...rest}
      >
        {children}
      </a>
    );
  }

  if (href.startsWith('#')) {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e);
      e.preventDefault();
      if (scrollToAnchor(href)) {
        window.history.replaceState(window.history.state, '', href);
        return;
      }
      // Not on this page: go to the home page section, or the section's own route
      const fallback = getAnchorFallbackRoute(href);
      navigate(pathname !== '/' ? `/${href}` : fallback || '/');
    };
    return (
      <a href={href} onClick={handleClick} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <Link to={href} onClick={onClick} {...rest}>
      {children}
    </Link>
  );
};

export default SmartLink;
