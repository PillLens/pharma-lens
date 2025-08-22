
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
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t border-border">
        {/* Navigation content */}
        <div className="px-2 py-1">
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
                    "flex flex-col items-center justify-center p-2 transition-colors duration-200 min-w-[60px] min-h-[49px]",
                    isActive 
                      ? "text-primary" 
                      : "text-muted-foreground"
                  )}
                  onTouchStart={() => handleTabPress(index)}
                  aria-label={item.label}
                >
                  <Icon className="w-6 h-6" />
                </NavLink>
              );
            })}

            {/* More button */}
            <Drawer open={isMoreOpen} onOpenChange={setIsMoreOpen}>
              <DrawerTrigger asChild>
                <button
                  className={cn(
                    "flex flex-col items-center justify-center p-2 transition-colors duration-200 min-w-[60px] min-h-[49px]",
                    isMoreNavActive 
                      ? "text-primary" 
                      : "text-muted-foreground"
                  )}
                  onTouchStart={handleMorePress}
                  aria-label="More options"
                >
                  <MoreHorizontal className="w-6 h-6" />
                </button>
              </DrawerTrigger>

              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>More Options</DrawerTitle>
                </DrawerHeader>
                
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-2 gap-4">
                    {moreNavigationItems.map((item) => {
                      const isActive = location.pathname === item.href;
                      const Icon = item.icon;
                      
                      // Special handling for language selector
                      if (item.isLanguageSelector) {
                        return (
                          <div
                            key={item.href}
                            className="flex flex-col items-center justify-center p-4 rounded-lg"
                          >
                            <Icon className="w-6 h-6 mb-2 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground mb-2">
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
                            "flex flex-col items-center justify-center p-4 rounded-lg transition-colors duration-200",
                            isActive 
                              ? "text-primary bg-primary/5" 
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
        <div className="h-safe-area-inset-bottom bg-background" />
      </nav>
    </>
  );
};

export default MobileTabNavigation;
