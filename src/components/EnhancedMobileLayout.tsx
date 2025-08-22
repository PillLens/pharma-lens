import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import EnhancedMobileNavigation from './EnhancedMobileNavigation';

interface EnhancedMobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

const EnhancedMobileLayout: React.FC<EnhancedMobileLayoutProps> = ({
  children,
  title = 'PharmaLens',
}) => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-3xl animate-floating" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-secondary/10 to-primary/10 rounded-full blur-3xl animate-floating" style={{ animationDelay: '1s' }} />
      </div>

      {/* Enhanced Mobile Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-border/20">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-glow">
              <div className="w-4 h-4 bg-white rounded-sm" />
            </div>
            <h1 className="text-lg font-bold text-foreground bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {title}
            </h1>
          </div>
          <EnhancedMobileNavigation />
        </div>
      </header>

      {/* Enhanced Content Area */}
      <main className="relative z-10">
        <div className="px-6 py-6 animate-fade-in-up">
          {children}
        </div>
        
        {/* Safe area padding for devices with home indicators */}
        <div className="h-8 md:h-0" />
      </main>
    </div>
  );
};

export default EnhancedMobileLayout;