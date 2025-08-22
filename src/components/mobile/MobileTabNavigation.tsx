
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, History, Pill, Users, Bell, Plus } from 'lucide-react';
import { TranslatedText } from '@/components/TranslatedText';
import { hapticService } from '@/services/hapticService';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    icon: Home,
    label: 'navigation.home',
    shortLabel: 'Ana',
    href: '/',
  },
  {
    icon: History,
    label: 'navigation.history',
    shortLabel: 'Tarix',
    href: '/history',
  },
  {
    icon: Pill,
    label: 'navigation.medications',
    shortLabel: 'Dərman',
    href: '/medications',
  },
  {
    icon: Bell,
    label: 'navigation.reminders',
    shortLabel: 'Xatır',
    href: '/reminders',
  },
  {
    icon: Users,
    label: 'navigation.family',
    shortLabel: 'Ailə',
    href: '/family',
  },
];

const MobileTabNavigation: React.FC = () => {
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPressed, setIsPressed] = useState<number | null>(null);

  useEffect(() => {
    const currentIndex = navigationItems.findIndex(item => item.href === location.pathname);
    if (currentIndex !== -1) {
      setActiveIndex(currentIndex);
    }
  }, [location.pathname]);

  const handleTabPress = async (index: number, href: string) => {
    setIsPressed(index);
    await hapticService.feedback('light');
    setActiveIndex(index);
    
    // Reset press state after animation
    setTimeout(() => setIsPressed(null), 150);
  };

  const handleLongPress = async (index: number) => {
    await hapticService.longPress();
    // Could add context menu or quick actions here
  };

  return (
    <>
      {/* Enhanced Mobile Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
        {/* Backdrop with enhanced blur and gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/90 to-background/85 backdrop-blur-xl border-t border-border/30" />
        
        {/* Active Tab Glow Effect */}
        <div 
          className="absolute top-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60 rounded-full transition-all duration-500 ease-out shadow-glow"
          style={{
            left: `${(activeIndex / navigationItems.length) * 100}%`,
            width: `${100 / navigationItems.length}%`,
            marginLeft: '8px',
            marginRight: '8px',
            transform: 'translateX(-50%) translateX(50%)'
          }}
        />
        
        {/* Navigation Content */}
        <div className="relative px-2 py-3">
          <div className="flex items-center justify-around">
            {navigationItems.map((item, index) => {
              const isActive = location.pathname === item.href;
              const isCurrentPressed = isPressed === index;
              const Icon = item.icon;
              
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-2xl transition-all duration-300 touch-target min-w-0 flex-1 relative group",
                    "active:scale-95 transform-gpu",
                    isCurrentPressed && "scale-95",
                    isActive 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onTouchStart={() => handleTabPress(index, item.href)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleLongPress(index);
                  }}
                >
                  {/* Enhanced Icon Container */}
                  <div className={cn(
                    "relative p-2.5 rounded-xl transition-all duration-300 transform-gpu",
                    isActive 
                      ? "bg-primary/15 shadow-primary/25 shadow-lg scale-110" 
                      : "group-hover:bg-muted/60 group-active:bg-muted/80"
                  )}>
                    <Icon className={cn(
                      "w-5 h-5 flex-shrink-0 transition-all duration-300",
                      isActive && "drop-shadow-sm"
                    )} />
                    
                    {/* Active pulse ring */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl bg-primary/20 animate-ping opacity-75" />
                    )}
                    
                    {/* Press feedback */}
                    {isCurrentPressed && (
                      <div className="absolute inset-0 rounded-xl bg-primary/30 animate-pulse" />
                    )}
                  </div>
                  
                  {/* Smart Text Label */}
                  <div className="flex flex-col items-center min-h-[32px] justify-center">
                    <span className={cn(
                      "text-xs font-medium transition-all duration-300 text-center leading-tight max-w-full",
                      isActive 
                        ? "text-primary font-semibold scale-105" 
                        : "text-muted-foreground group-hover:text-foreground"
                    )}>
                      {/* Use short label for mobile optimization */}
                      <span className="block sm:hidden">{item.shortLabel}</span>
                      <span className="hidden sm:block">
                        <TranslatedText translationKey={item.label} />
                      </span>
                    </span>
                  </div>
                  
                  {/* Active tab background glow */}
                  {isActive && (
                    <>
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-primary/5 via-primary/3 to-transparent pointer-events-none" />
                      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-t from-primary/10 via-transparent to-transparent blur-sm pointer-events-none opacity-60" />
                    </>
                  )}
                  
                  {/* Ripple effect container */}
                  <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                    {isCurrentPressed && (
                      <div className="absolute inset-0 bg-primary/20 animate-ping rounded-2xl" />
                    )}
                  </div>
                </NavLink>
              );
            })}
          </div>
        </div>
        
        {/* Enhanced bottom safe area with gradient fade */}
        <div className="h-safe-area-inset-bottom bg-gradient-to-t from-background via-background/95 to-transparent" />
      </nav>

      {/* Floating Action Button for quick scan */}
      <div className="fixed bottom-20 right-4 z-40">
        <NavLink
          to="/"
          className={cn(
            "flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300",
            "bg-gradient-to-r from-primary to-primary-light text-primary-foreground",
            "shadow-floating hover:shadow-glow hover:scale-110 active:scale-95",
            "border-2 border-primary/20"
          )}
          onTouchStart={() => hapticService.buttonPress()}
        >
          <Plus className="w-6 h-6" />
          
          {/* FAB glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-primary-light/20 animate-pulse opacity-60" />
        </NavLink>
      </div>
    </>
  );
};

export default MobileTabNavigation;
