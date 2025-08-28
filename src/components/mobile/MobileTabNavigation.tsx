
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Pill, Bell, LayoutDashboard } from 'lucide-react';
import { hapticService } from '@/services/hapticService';
import { cn } from '@/lib/utils';
import { TranslatedText } from '@/components/TranslatedText';

// Main navigation items (3 core items)
const mainNavigationItems = [
  {
    icon: Home,
    labelKey: 'navigation.home',
    href: '/',
    category: 'core'
  },
  {
    icon: Pill,
    labelKey: 'navigation.medications',
    href: '/medications',
    category: 'medical'
  },
  {
    icon: Bell,
    labelKey: 'navigation.reminders',
    href: '/reminders',
    category: 'medical'
  },
];

const MobileTabNavigation: React.FC = () => {
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const currentMainIndex = mainNavigationItems.findIndex(item => item.href === location.pathname);
    if (currentMainIndex !== -1) {
      setActiveIndex(currentMainIndex);
    }
  }, [location.pathname]);

  const handleNavigate = async () => {
    await hapticService.feedback('light');
  };

  return (
    <>
      <nav className="fixed left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50 shadow-lg will-change-transform" style={{ bottom: 'env(safe-area-inset-bottom)', height: 'var(--bottom-nav-h, 64px)' }}>
        {/* Modern Navigation with Labels */}
        <div className="px-2 py-2 h-full">
          <div className="flex items-center justify-around max-w-md mx-auto h-full">
            {/* Main navigation tabs */}
            {mainNavigationItems.map((item, index) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center px-3 py-2 rounded-xl min-w-[64px] min-h-[56px] relative",
                    isActive 
                      ? "text-white bg-primary shadow-lg" 
                      : "text-slate-600 dark:text-slate-400"
                  )}
                  onClick={handleNavigate}
                  aria-label={item.labelKey}
                >
                  <Icon className={cn("w-5 h-5 mb-1", isActive && "text-white")} />
                  <span className={cn("text-xs font-medium", isActive && "text-white")}>
                    <TranslatedText translationKey={item.labelKey} />
                  </span>
                  {isActive && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full opacity-80"></div>
                  )}
                </NavLink>
              );
            })}

            {/* Dashboard button */}
            <NavLink
              to="/dashboard"
              className={cn(
                "flex flex-col items-center justify-center px-3 py-2 rounded-xl min-w-[64px] min-h-[56px] relative",
                location.pathname === '/dashboard'
                  ? "text-white bg-primary shadow-lg" 
                  : "text-slate-600 dark:text-slate-400"
              )}
              onClick={handleNavigate}
              aria-label="Dashboard"
            >
              <LayoutDashboard className={cn("w-5 h-5 mb-1", location.pathname === '/dashboard' && "text-white")} />
              <span className={cn("text-xs font-medium", location.pathname === '/dashboard' && "text-white")}>
                <TranslatedText translationKey="navigation.dashboard" />
              </span>
              {location.pathname === '/dashboard' && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full opacity-80"></div>
              )}
            </NavLink>
          </div>
        </div>
      </nav>
    </>
  );
};

export default MobileTabNavigation;
