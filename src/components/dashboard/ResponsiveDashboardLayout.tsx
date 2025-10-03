import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ResponsiveDashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveDashboardLayout: React.FC<ResponsiveDashboardLayoutProps> = ({ 
  children, 
  className 
}) => {
  const isMobile = useIsMobile();

  return (
    <div className={cn(
      'min-h-screen bg-background',
      isMobile ? 'mobile-dashboard' : 'desktop-dashboard',
      className
    )}>
      {children}
    </div>
  );
};
