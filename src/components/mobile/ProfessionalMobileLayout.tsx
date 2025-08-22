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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Clean Mobile Header */}
      {showHeader && title && (
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border safe-area-top">
          <div className="flex items-center justify-center px-4 py-3">
            <h1 className="text-lg font-semibold text-foreground">
              {title}
            </h1>
          </div>
        </header>
      )}

      {/* Scrollable Content Area */}
      <main className={cn(
        "flex-1 overflow-y-auto smooth-scroll",
        className
      )}>
        <div className="pb-20">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <MobileTabNavigation />
    </div>
  );
};

export default ProfessionalMobileLayout;