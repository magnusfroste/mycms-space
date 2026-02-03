
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import DynamicPage from "./pages/DynamicPage";
import Chat from "./pages/Chat";
import BlockDemo from "./pages/BlockDemo";
import Admin from "./pages/Admin";
import BlogPost from "./pages/BlogPost";
import BlogArchive from "./pages/BlogArchive";
import NotFound from "./pages/NotFound";
import { usePageTracking } from "@/hooks/usePageTracking";

// Page view tracking component (internal + Google Analytics)
const PageTracker = () => {
  const location = useLocation();
  
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
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <PageTracker />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/demo" element={<BlockDemo />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/blog" element={<BlogArchive />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              {/* Dynamic page route - catches any slug */}
              <Route path="/:slug" element={<DynamicPage />} />
              {/* 404 fallback */}
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
