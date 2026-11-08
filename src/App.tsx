
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { usePageTracking } from "@/hooks/usePageTracking";
import { useBrandingTheme } from "@/hooks/useBrandingTheme";
import { useColorMode } from "@/hooks/useColorMode";
import GoogleAnalytics from "@/components/common/GoogleAnalytics";

// Route-level code splitting: only the home page is in the main bundle
const DynamicPage = lazy(() => import("./pages/DynamicPage"));
const Chat = lazy(() => import("./pages/Chat"));
const BlockDemo = lazy(() => import("./pages/BlockDemo"));
const Admin = lazy(() => import("./pages/Admin"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const BlogArchive = lazy(() => import("./pages/BlogArchive"));
const ProjectCaseStudy = lazy(() => import("./pages/ProjectCaseStudy"));

// Theme and tracking component
const AppBootstrap = () => {
  const location = useLocation();
  // Apply color mode (light/dark)
  useColorMode();
  
  // Apply branding theme (single source of truth)
  useBrandingTheme();
  
  // Internal analytics tracking
  usePageTracking();
  
  useEffect(() => {
    // Google Analytics tracking (if available)
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search
      });
    }
  }, [location]);
  
  return null;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => {
  // Global unhandled rejection handler to prevent async errors from crashing UI
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled rejection:", event.reason);
      event.preventDefault();
    };
    window.addEventListener("unhandledrejection", handleRejection);
    return () => window.removeEventListener("unhandledrejection", handleRejection);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GoogleAnalytics />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppBootstrap />
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/demo" element={<BlockDemo />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/blog" element={<BlogArchive />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/project/:repoName" element={<ProjectCaseStudy />} />
            {/* Dynamic page route - catches any slug */}
            <Route path="/:slug" element={<DynamicPage />} />
            {/* 404 fallback */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
