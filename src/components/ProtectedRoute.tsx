import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light to-accent">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Desktop logic: only allow home page without authentication
  if (!isMobile) {
    if (!user && location.pathname !== '/') {
      return <Navigate to="/auth" replace />;
    }
    return <>{children}</>;
  }

  // Mobile users still require authentication for all pages
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}