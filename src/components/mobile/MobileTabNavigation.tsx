
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, History, Pill, Users, Bell, User, Shield, Settings } from 'lucide-react';
import { hapticService } from '@/services/hapticService';
import { cn } from '@/lib/utils';

const navigationItems = [
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

  useEffect(() => {
    const currentIndex = navigationItems.findIndex(item => item.href === location.pathname);
    if (currentIndex !== -1) {
      setActiveIndex(currentIndex);
    }
  }, [location.pathname]);

  const handleTabPress = async (index: number) => {
    setIsPressed(index);
    await hapticService.feedback('light');
    setActiveIndex(index);
    
    setTimeout(() => setIsPressed(null), 150);
  };

  const handleLongPress = async (index: number) => {
    await hapticService.longPress();
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom md:hidden">
      {/* Enhanced backdrop with blur and gradient */}
      <div className="absolute inset-0 bg-background/98 backdrop-blur-xl border-t border-border/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />
      
      {/* Active tab indicator - Dynamic positioning */}
      <div 
        className="absolute top-0 h-0.5 bg-gradient-to-r from-primary/50 via-primary to-primary/50 rounded-full transition-all duration-500 ease-out shadow-glow"
        style={{
          left: `${(activeIndex / navigationItems.length) * 100}%`,
          width: `${100 / navigationItems.length}%`,
          margin: '0 1%'
        }}
      />
      
      {/* Navigation content */}
      <div className="relative px-2 py-3">
        <div className="flex items-stretch overflow-x-auto scrollbar-hide gap-1">
          {navigationItems.map((item, index) => {
            const isActive = location.pathname === item.href;
            const isCurrentPressed = isPressed === index;
            const Icon = item.icon;
            
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center px-3 py-2 rounded-2xl transition-all duration-300 touch-target min-w-0 flex-shrink-0 relative group",
                  "active:scale-95 transform-gpu",
                  isCurrentPressed && "scale-95",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onTouchStart={() => handleTabPress(index)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleLongPress(index);
                }}
                aria-label={item.label}
                style={{ minWidth: '60px' }}
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
                
                {/* Text label with responsive sizing */}
                <span className={cn(
                  "text-xs font-medium transition-all duration-300 text-center leading-tight",
                  isActive 
                    ? "text-primary font-semibold" 
                    : "text-muted-foreground group-hover:text-foreground",
                  "max-w-full truncate px-1"
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

                {/* Category indicator dot */}
                <div className={cn(
                  "absolute -top-1 -right-1 w-2 h-2 rounded-full transition-all duration-300",
                  item.category === 'core' && "bg-primary/60",
                  item.category === 'medical' && "bg-success/60", 
                  item.category === 'social' && "bg-info/60",
                  item.category === 'system' && "bg-warning/60",
                  !isActive && "opacity-0",
                  isActive && "opacity-100 scale-100"
                )} />
              </NavLink>
            );
          })}
        </div>
      </div>
      
      {/* Enhanced bottom safe area with gradient */}
      <div className="h-safe-area-inset-bottom bg-gradient-to-t from-background via-background/98 to-transparent" />
      
      {/* Scroll hint indicators */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-gradient-to-r from-background/80 to-transparent pointer-events-none" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-gradient-to-l from-background/80 to-transparent pointer-events-none" />
    </nav>
  );
};

export default MobileTabNavigation;
