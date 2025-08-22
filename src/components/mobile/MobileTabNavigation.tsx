
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, History, Pill, Bell, Users, Shield, User, MoreHorizontal, Globe2 } from 'lucide-react';
import { hapticService } from '@/services/hapticService';
import { cn } from '@/lib/utils';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { LanguageSelector } from '@/components/LanguageSelector';

// Main navigation items (4 most important)
const mainNavigationItems = [
  {
    icon: Home,
    label: 'Home',
    href: '/',
    category: 'core'
  },
  {
    icon: History,
    label: 'History',
    href: '/history',
    category: 'core'
  },
  {
    icon: Pill,
    label: 'Medications',
    href: '/medications',
    category: 'medical'
  },
  {
    icon: Bell,
    label: 'Reminders',
    href: '/reminders',
    category: 'medical'
  },
];

// Additional items shown in More menu
const moreNavigationItems = [
  {
    icon: Users,
    label: 'Family',
    href: '/family',
    category: 'social'
  },
  {
    icon: Shield,
    label: 'Security',
    href: '/security',
    category: 'system'
  },
  {
    icon: User,
    label: 'Auth',
    href: '/auth',
    category: 'system'
  },
  {
    icon: Globe2,
    label: 'Language',
    href: '#language',
    category: 'system',
    isLanguageSelector: true
  },
];

const MobileTabNavigation: React.FC = () => {
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPressed, setIsPressed] = useState<number | null>(null);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Check if current path is in main navigation or more navigation
  const isMainNavActive = mainNavigationItems.some(item => item.href === location.pathname);
  const isMoreNavActive = moreNavigationItems.some(item => item.href === location.pathname);

  useEffect(() => {
    const currentMainIndex = mainNavigationItems.findIndex(item => item.href === location.pathname);
    if (currentMainIndex !== -1) {
      setActiveIndex(currentMainIndex);
    }
  }, [location.pathname]);

  const handleTabPress = async (index: number) => {
    setIsPressed(index);
    await hapticService.feedback('light');
    setActiveIndex(index);
    
    setTimeout(() => setIsPressed(null), 150);
  };

  const handleMorePress = async () => {
    await hapticService.feedback('light');
    setIsMoreOpen(true);
  };

  const handleMoreItemPress = async () => {
    await hapticService.feedback('light');
    setIsMoreOpen(false);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50 shadow-lg">
        {/* Modern Navigation with Labels */}
        <div className="px-2 py-2">
          <div className="flex items-center justify-around max-w-md mx-auto">
            {/* Main navigation tabs */}
            {mainNavigationItems.map((item, index) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-200 min-w-[64px] min-h-[56px] relative",
                    isActive 
                      ? "text-white bg-primary shadow-lg" 
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                  onTouchStart={() => handleTabPress(index)}
                  aria-label={item.label}
                >
                  <Icon className={cn("w-5 h-5 mb-1", isActive && "text-white")} />
                  <span className={cn("text-xs font-medium", isActive && "text-white")}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full opacity-80"></div>
                  )}
                </NavLink>
              );
            })}

            {/* More button */}
            <Drawer open={isMoreOpen} onOpenChange={setIsMoreOpen}>
              <DrawerTrigger asChild>
                <button
                  className={cn(
                    "flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-200 min-w-[64px] min-h-[56px]",
                    isMoreNavActive 
                      ? "text-white bg-primary shadow-lg" 
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                  onTouchStart={handleMorePress}
                  aria-label="More options"
                >
                  <MoreHorizontal className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">More</span>
                </button>
              </DrawerTrigger>

              <DrawerContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
                <DrawerHeader className="text-center border-b border-slate-200/50 dark:border-slate-700/50">
                  <DrawerTitle className="text-lg font-semibold">More Options</DrawerTitle>
                </DrawerHeader>
                
                <div className="px-6 py-6">
                  <div className="grid grid-cols-2 gap-4">
                    {moreNavigationItems.map((item) => {
                      const isActive = location.pathname === item.href;
                      const Icon = item.icon;
                      
                      // Special handling for language selector
                      if (item.isLanguageSelector) {
                        return (
                          <div
                            key={item.href}
                            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50"
                          >
                            <Icon className="w-6 h-6 mb-2 text-slate-600 dark:text-slate-400" />
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-200 mb-3">
                              {item.label}
                            </span>
                            <LanguageSelector />
                          </div>
                        );
                      }
                      
                      return (
                        <NavLink
                          key={item.href}
                          to={item.href}
                          className={cn(
                            "flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-200 border",
                            isActive 
                              ? "text-white bg-primary border-primary shadow-lg" 
                              : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                          )}
                          onTouchStart={handleMoreItemPress}
                          aria-label={item.label}
                        >
                          <Icon className="w-6 h-6 mb-2" />
                          <span className="text-sm font-medium text-center">
                            {item.label}
                          </span>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
        
        {/* Safe area padding */}
        <div className="h-safe-area-inset-bottom bg-white/95 dark:bg-slate-900/95" />
      </nav>
    </>
  );
};

export default MobileTabNavigation;
