import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { DesktopSidebar } from './DesktopSidebar';
import MobileTabNavigation from '../mobile/MobileTabNavigation';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1 min-h-0 overflow-y-auto" data-scrollable>
          <div className="pb-32 min-h-full">
            {children}
          </div>
        </main>
        <MobileTabNavigation />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DesktopSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Desktop Header */}
          <header className="sticky top-0 z-40 h-14 border-b border-border bg-background/95 backdrop-blur-sm px-4 flex items-center">
            <SidebarTrigger className="h-8 w-8" />
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto" data-scrollable>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}