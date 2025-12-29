import React, { useState, useEffect } from "react";
import { Menu, X, Home, ExternalLink } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavLinks } from "@/hooks/useNavLinks";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const { data: navLinks = [] } = useNavLinks();

  // Toggle mobile menu
  const toggleMenu = () => setIsOpen(!isOpen);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Helper function to stop any ongoing speech synthesis when navigating
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
    const className = isMobile ? "nav-link-mobile" : "nav-link";
    const onClick = isMobile ? () => { stopSpeech(); toggleMenu(); } : stopSpeech;

    if (link.is_external) {
      return (
        <a
          key={link.url}
          href={link.url}
          className={`${className} flex items-center gap-1`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClick}
        >
          {link.label}
          <ExternalLink size={14} className="opacity-50" />
        </a>
      );
    }

    // Check if it's an internal route (starts with /) vs anchor link (starts with #)
    if (link.url.startsWith('/')) {
      return (
        <Link key={link.url} to={link.url} className={className} onClick={onClick}>
          {link.label}
        </Link>
      );
    }

    return (
      <a key={link.url} href={link.url} className={className} onClick={isMobile ? toggleMenu : undefined}>
        {link.label}
      </a>
    );
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/80 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div>
            <Link
              to="/"
              className="text-2xl font-semibold bg-gradient-to-r from-apple-purple to-apple-blue bg-clip-text text-transparent"
            >
              froste.eu
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-10 items-center">
            {isHomePage ? (
              // Dynamic nav links from database
              navLinks.map((link) => renderNavLink(link))
            ) : (
              // Links for other pages
              <Link
                to="/"
                className="flex items-center gap-1.5 px-4 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full font-medium transition-all hover:bg-purple-200 dark:hover:bg-purple-900/50"
                onClick={stopSpeech}
              >
                <Home size={18} />
                Home
              </Link>
            )}
            <ThemeToggle />
          </nav>

          {/* Mobile Menu Button and Theme Toggle */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button className="text-foreground focus:outline-none" onClick={toggleMenu} aria-label="Toggle mobile menu">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <nav className="md:hidden py-4 pb-6 space-y-4 flex flex-col items-center">
            {isHomePage ? (
              // Dynamic nav links from database
              navLinks.map((link) => renderNavLink(link, true))
            ) : (
              // Mobile links for other pages
              <Link
                to="/"
                className="flex items-center gap-1.5 px-4 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full font-medium"
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
        )}
      </div>
    </header>
  );
};

export default Header;
