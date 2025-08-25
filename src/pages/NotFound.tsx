import { useTranslation } from "@/hooks/useTranslation";
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { TranslatedText } from "@/components/TranslatedText";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-foreground">404</h1>
        <TranslatedText 
          translationKey="notFound.title" 
          fallback="Oops! Page not found" 
          className="text-xl text-muted-foreground mb-4" 
          as="p" 
        />
        <Link to="/" className="text-primary hover:text-primary/80 underline transition-colors">
          <TranslatedText 
            translationKey="notFound.action" 
            fallback="Return to Home" 
          />
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
