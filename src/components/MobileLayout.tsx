import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileNavigation from './MobileNavigation';

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  title = 'CareCapsule',
}) => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-secondary-light">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold text-foreground truncate flex-1">
            {title}
          </h1>
          <MobileNavigation />
        </div>
      </header>

      {/* Content */}
      <main className="pb-safe-area-inset-bottom">
        <div className="px-4 py-4">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MobileLayout;