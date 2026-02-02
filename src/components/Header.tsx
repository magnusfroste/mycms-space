// ============================================
// Header - 2026 Design System
// Glass effect with smooth transitions
// ============================================

import React, { useState, useEffect } from "react";
import { Menu, X, Home, ExternalLink } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavLinks } from "@/hooks/useNavLinks";
import { useHeaderModule } from "@/models/modules";
import { cn } from "@/lib/utils";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const { data: navLinks = [] } = useNavLinks();
  const { config: headerConfig, isLoading } = useHeaderModule();

  const toggleMenu = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const stopSpeech = () => {
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } catch (error) {
      console.error("Error stopping speech:", error);
    }
  };

  const renderNavLink = (link: { label: string; url: string; is_external: boolean }, isMobile = false) => {
    const baseClasses = isMobile 
      ? "text-foreground/80 hover:text-foreground transition-colors duration-200 text-lg font-medium py-2"
      : "relative text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm font-medium";
    
    const onClick = isMobile ? () => { stopSpeech(); toggleMenu(); } : stopSpeech;

    const linkContent = (
      <>
        {link.label}
        {link.is_external && <ExternalLink size={14} className="ml-1 opacity-50 inline" />}
      </>
    );

    if (link.is_external) {
      return (
        <a
          key={link.url}
          href={link.url}
          className={baseClasses}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClick}
        >
          {linkContent}
        </a>
      );
    }

    if (link.url.startsWith('/')) {
      return (
        <Link key={link.url} to={link.url} className={baseClasses} onClick={onClick}>
          {link.label}
        </Link>
      );
    }

    return (
      <a key={link.url} href={link.url} className={baseClasses} onClick={isMobile ? toggleMenu : undefined}>
        {link.label}
      </a>
    );
  };

  const renderLogo = () => {
    if (headerConfig?.logo_image_url) {
      return (
        <Link to="/" className="block">
          <img 
            src={headerConfig.logo_image_url} 
            alt={headerConfig.logo_text || 'Logo'} 
            className="h-8 w-auto"
          />
        </Link>
      );
    }
    
    return (
      <Link
        to="/"
        className="text-xl font-semibold bg-gradient-primary bg-clip-text text-transparent hover:opacity-80 transition-opacity"
      >
        {headerConfig?.logo_text || 'froste.eu'}
      </Link>
    );
  };

  return (
    <header
      className={cn(
        headerConfig?.sticky !== false ? 'sticky' : 'relative',
        'top-0 z-50 transition-all duration-500',
        scrolled 
          ? 'bg-background/70 backdrop-blur-xl border-b border-border/50 shadow-sm' 
          : headerConfig?.transparent_on_hero && isHomePage 
            ? 'bg-transparent' 
            : 'bg-background/50 backdrop-blur-sm'
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {renderLogo()}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {isHomePage ? (
              navLinks.map((link, index) => (
                <div 
                  key={link.url} 
                  className="animate-fade-in" 
                  style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                >
                  {renderNavLink(link)}
                </div>
              ))
            ) : (
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium transition-all hover:bg-primary/20 hover:scale-105"
                onClick={stopSpeech}
              >
                <Home size={16} />
                Home
              </Link>
            )}
            {headerConfig?.show_theme_toggle !== false && (
              <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <ThemeToggle />
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            {headerConfig?.show_theme_toggle !== false && <ThemeToggle />}
            <button 
              className={cn(
                "relative p-2 rounded-xl transition-all duration-200",
                isOpen ? "bg-muted" : "hover:bg-muted/50"
              )}
              onClick={toggleMenu} 
              aria-label="Toggle mobile menu"
            >
              <div className="relative w-5 h-5">
                <span className={cn(
                  "absolute left-0 w-5 h-0.5 bg-foreground transition-all duration-300",
                  isOpen ? "top-1/2 -translate-y-1/2 rotate-45" : "top-1"
                )} />
                <span className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 w-5 h-0.5 bg-foreground transition-all duration-300",
                  isOpen ? "opacity-0 scale-0" : "opacity-100"
                )} />
                <span className={cn(
                  "absolute left-0 w-5 h-0.5 bg-foreground transition-all duration-300",
                  isOpen ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-1"
                )} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={cn(
          "md:hidden overflow-hidden transition-all duration-300",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}>
          <nav className="py-6 flex flex-col items-center gap-4 border-t border-border/50">
            {isHomePage ? (
              navLinks.map((link, index) => (
                <div 
                  key={link.url}
                  className={cn(
                    "animate-fade-in",
                    isOpen && `animate-slide-up`
                  )}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {renderNavLink(link, true)}
                </div>
              ))
            ) : (
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/10 text-primary rounded-full font-medium"
                onClick={() => {
                  stopSpeech();
                  toggleMenu();
                }}
              >
                <Home size={18} />
                Home
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
