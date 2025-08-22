
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, History, Pill, Bell, Users, Shield, User, MoreHorizontal } from 'lucide-react';
import { hapticService } from '@/services/hapticService';
import { cn } from '@/lib/utils';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

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
      <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom md:hidden">
        {/* Enhanced backdrop with blur and gradient */}
        <div className="absolute inset-0 bg-background/98 backdrop-blur-xl border-t border-border/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />
        
        {/* Active tab indicator - Only show for main tabs */}
        {isMainNavActive && (
          <div 
            className="absolute top-0 h-0.5 bg-gradient-to-r from-primary/50 via-primary to-primary/50 rounded-full transition-all duration-500 ease-out shadow-glow"
            style={{
              left: `${(activeIndex / 5) * 100}%`,
              width: `${100 / 5}%`,
              margin: '0 1%'
            }}
          />
        )}
        
        {/* Navigation content */}
        <div className="relative px-2 py-3">
          <div className="flex items-stretch justify-center gap-1">
            {/* Main navigation tabs */}
            {mainNavigationItems.map((item, index) => {
              const isActive = location.pathname === item.href;
              const isCurrentPressed = isPressed === index;
              const Icon = item.icon;
              
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center px-4 py-2 rounded-2xl transition-all duration-300 touch-target flex-1 relative group",
                    "active:scale-95 transform-gpu",
                    isCurrentPressed && "scale-95",
                    isActive 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onTouchStart={() => handleTabPress(index)}
                  aria-label={item.label}
                >
                  {/* Icon container with enhanced styling */}
                  <div className={cn(
                    "relative p-2.5 rounded-xl transition-all duration-300 transform-gpu mb-1",
                    isActive 
                      ? "bg-primary/15 shadow-md" 
                      : "group-hover:bg-muted/60 group-active:bg-muted/80"
                  )}>
                    <Icon className={cn(
                      "w-5 h-5 flex-shrink-0 transition-all duration-300",
                      isActive && "drop-shadow-sm"
                    )} />
                    
                    {/* Press feedback */}
                    {isCurrentPressed && (
                      <div className="absolute inset-0 rounded-xl bg-primary/30 animate-pulse" />
                    )}
                  </div>
                  
                  {/* Text label */}
                  <span className={cn(
                    "text-xs font-medium transition-all duration-300 text-center leading-tight",
                    isActive 
                      ? "text-primary font-semibold" 
                      : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {item.label}
                  </span>
                  
                  {/* Active tab background glow */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-primary/8 via-primary/4 to-transparent pointer-events-none" />
                  )}
                  
                  {/* Enhanced ripple effect */}
                  <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                    {isCurrentPressed && (
                      <div className="absolute inset-0 bg-primary/15 rounded-2xl animate-ping opacity-75" />
                    )}
                  </div>
                </NavLink>
              );
            })}

            {/* More button */}
            <Drawer open={isMoreOpen} onOpenChange={setIsMoreOpen}>
              <DrawerTrigger asChild>
                <button
                  className={cn(
                    "flex flex-col items-center justify-center px-4 py-2 rounded-2xl transition-all duration-300 touch-target flex-1 relative group",
                    "active:scale-95 transform-gpu",
                    isMoreNavActive 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onTouchStart={handleMorePress}
                  aria-label="More options"
                >
                  {/* Icon container */}
                  <div className={cn(
                    "relative p-2.5 rounded-xl transition-all duration-300 transform-gpu mb-1",
                    isMoreNavActive 
                      ? "bg-primary/15 shadow-md" 
                      : "group-hover:bg-muted/60 group-active:bg-muted/80"
                  )}>
                    <MoreHorizontal className={cn(
                      "w-5 h-5 flex-shrink-0 transition-all duration-300",
                      isMoreNavActive && "drop-shadow-sm"
                    )} />
                  </div>
                  
                  {/* Text label */}
                  <span className={cn(
                    "text-xs font-medium transition-all duration-300 text-center leading-tight",
                    isMoreNavActive 
                      ? "text-primary font-semibold" 
                      : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    More
                  </span>
                  
                  {/* Active background glow for more items */}
                  {isMoreNavActive && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-primary/8 via-primary/4 to-transparent pointer-events-none" />
                  )}
                  
                  {/* Badge indicator for active more item */}
                  {isMoreNavActive && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary/60 transition-all duration-300" />
                  )}
                </button>
              </DrawerTrigger>

              <DrawerContent className="max-h-[60vh]">
                <DrawerHeader>
                  <DrawerTitle>More Options</DrawerTitle>
                </DrawerHeader>
                
                <div className="px-4 pb-8">
                  <div className="grid grid-cols-3 gap-6">
                    {moreNavigationItems.map((item) => {
                      const isActive = location.pathname === item.href;
                      const Icon = item.icon;
                      
                      return (
                        <NavLink
                          key={item.href}
                          to={item.href}
                          className={cn(
                            "flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300 touch-target relative group",
                            "active:scale-95 transform-gpu",
                            isActive 
                              ? "text-primary bg-primary/10" 
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                          )}
                          onTouchStart={handleMoreItemPress}
                          aria-label={item.label}
                        >
                          {/* Icon container */}
                          <div className={cn(
                            "relative p-3 rounded-xl transition-all duration-300 transform-gpu mb-2",
                            isActive 
                              ? "bg-primary/15 shadow-md" 
                              : "group-hover:bg-muted/60"
                          )}>
                            <Icon className={cn(
                              "w-6 h-6 flex-shrink-0 transition-all duration-300",
                              isActive && "drop-shadow-sm"
                            )} />
                          </div>
                          
                          {/* Text label */}
                          <span className={cn(
                            "text-sm font-medium transition-all duration-300 text-center",
                            isActive 
                              ? "text-primary font-semibold" 
                              : "text-muted-foreground group-hover:text-foreground"
                          )}>
                            {item.label}
                          </span>
                          
                          {/* Active indicator */}
                          {isActive && (
                            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary transition-all duration-300" />
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
        
        {/* Enhanced bottom safe area with gradient */}
        <div className="h-safe-area-inset-bottom bg-gradient-to-t from-background via-background/98 to-transparent" />
      </nav>
    </>
  );
};

export default MobileTabNavigation;
