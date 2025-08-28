
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileTabNavigation from './MobileTabNavigation';
import { cn } from '@/lib/utils';

interface ProfessionalMobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
  className?: string;
}

const ProfessionalMobileLayout: React.FC<ProfessionalMobileLayoutProps> = ({
  children,
  title,
  showHeader = true,
  className
}) => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ minHeight: '100dvh' }}>
      {/* Premium Mobile Header */}
      {showHeader && title && (
        <header className="sticky top-0 z-40 bg-background backdrop-blur-md border-b border-border/50 safe-area-top">
          <div className="px-6 py-4">
            <h1 className="text-xl font-bold text-foreground text-center">
              {title}
            </h1>
          </div>
        </header>
      )}

      {/* Content Area - Optimized spacing for mobile */}
      <main className={cn("flex-1 min-h-0 overflow-y-auto main-scroll remove-last-margin", className)} data-scrollable>
        <div className="min-h-full px-4 py-4">
          {children}
        </div>
      </main>

      {/* Enhanced Bottom Navigation */}
      <MobileTabNavigation />
    </div>
  );
};

export default ProfessionalMobileLayout;
