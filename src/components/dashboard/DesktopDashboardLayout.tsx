import React from 'react';
import { cn } from '@/lib/utils';

interface DesktopDashboardLayoutProps {
  sidebar?: React.ReactNode;
  main: React.ReactNode;
  insights?: React.ReactNode;
  className?: string;
}

export const DesktopDashboardLayout: React.FC<DesktopDashboardLayoutProps> = ({
  sidebar,
  main,
  insights,
  className
}) => {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Stats */}
          {sidebar && (
            <aside className="col-span-3 space-y-4">
              {sidebar}
            </aside>
          )}

          {/* Main Content */}
          <main className={cn(
            'space-y-6',
            sidebar && insights ? 'col-span-6' : sidebar || insights ? 'col-span-9' : 'col-span-12'
          )}>
            {main}
          </main>

          {/* Right Panel - Insights */}
          {insights && (
            <aside className="col-span-3 space-y-4">
              {insights}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};
