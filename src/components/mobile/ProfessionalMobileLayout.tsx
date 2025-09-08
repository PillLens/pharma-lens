
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileTabNavigation from './MobileTabNavigation';
import { cn } from '@/lib/utils';

interface ProfessionalMobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
  className?: string;
  leftAction?: React.ReactNode;
}

const ProfessionalMobileLayout: React.FC<ProfessionalMobileLayoutProps> = ({
  children,
  title,
  showHeader = true,
  className,
  leftAction
}) => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className="edge-to-edge min-h-screen bg-background flex flex-col device-rounded" style={{ minHeight: '100dvh', backgroundColor: 'hsl(var(--background))' }}>
      {/* Premium Mobile Header with safe area */}
        {showHeader && title && (
          <header className="sticky top-0 z-40 bg-background backdrop-blur-md border-b border-border/50 safe-area-top safe-area-x" style={{ backgroundColor: 'white' }}>
          <div className="px-6 py-4 flex items-center justify-between">
            {leftAction && (
              <div className="flex items-center">
                {leftAction}
              </div>
            )}
            <h1 className="text-xl font-bold text-foreground text-center flex-1">
              {title}
            </h1>
            {leftAction && <div className="w-12" />} {/* Spacer for balance when leftAction exists */}
          </div>
        </header>
      )}

      {/* Content Area - Optimized spacing for mobile with safe areas */}
      <main className={cn("flex-1 min-h-0 overflow-y-auto main-scroll remove-last-margin safe-area-x", className)} data-scrollable>
        <div className="min-h-full">
          {children}
        </div>
      </main>

      {/* Enhanced Bottom Navigation */}
      <MobileTabNavigation />
    </div>
  );
};

export default ProfessionalMobileLayout;
