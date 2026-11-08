import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/common/SEOHead";
import { Button } from "@/components/ui/button";

/**
 * 404 page. Rendered in place (the requested URL is kept) with the
 * regular site chrome and a noindex robots tag.
 */
const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.warn(
      "404: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Page not found"
        description="The page you are looking for does not exist."
        noIndex
      />
      <Header />
      <main className="flex-grow flex items-center justify-center px-4 py-24">
        <div className="text-center max-w-md">
          <p className="text-sm font-medium text-primary uppercase tracking-widest mb-4">404</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Page not found</h1>
          <p className="text-muted-foreground mb-8">
            The page <span className="font-mono text-foreground break-all">{location.pathname}</span> doesn't exist or has been moved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild className="rounded-full">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                Back to home
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/contact">
                <Mail className="h-4 w-4" />
                Contact
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
