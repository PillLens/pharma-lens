
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, History, Pill, Users, Bell, User, Settings, Shield } from 'lucide-react';
import { hapticService } from '@/services/hapticService';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    icon: Home,
    label: 'Home',
    href: '/',
  },
  {
    icon: History,
    label: 'History',
    href: '/history',
  },
  {
    icon: Pill,
    label: 'Medications',
    href: '/medications',
  },
  {
    icon: Bell,
    label: 'Reminders',
    href: '/reminders',
  },
  {
    icon: Users,
    label: 'Family',
    href: '/family',
  },
  {
    icon: User,
    label: 'Auth',
    href: '/auth',
  },
  {
    icon: Shield,
    label: 'Security',
    href: '/security',
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
      {/* Enhanced backdrop with blur */}
      <div className="absolute inset-0 bg-background/95 backdrop-blur-xl border-t border-border/30" />
      
      {/* Active tab indicator */}
      <div 
        className="absolute top-0 h-1 bg-primary rounded-full transition-all duration-500 ease-out"
        style={{
          left: `${(activeIndex / navigationItems.length) * 100}%`,
          width: `${100 / navigationItems.length}%`,
          margin: '0 2px'
        }}
      />
      
      {/* Navigation content */}
      <div className="relative px-1 py-2">
        <div className="flex items-center justify-around overflow-x-auto scrollbar-hide">
          {navigationItems.map((item, index) => {
            const isActive = location.pathname === item.href;
            const isCurrentPressed = isPressed === index;
            const Icon = item.icon;
            
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 touch-target min-w-0 flex-shrink-0 relative group",
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
                style={{ minWidth: '48px' }}
              >
                {/* Icon container */}
                <div className={cn(
                  "relative p-2 rounded-lg transition-all duration-300 transform-gpu",
                  isActive 
                    ? "bg-primary/15" 
                    : "group-hover:bg-muted/60 group-active:bg-muted/80"
                )}>
                  <Icon className="w-5 h-5 flex-shrink-0 transition-all duration-300" />
                  
                  {/* Press feedback */}
                  {isCurrentPressed && (
                    <div className="absolute inset-0 rounded-lg bg-primary/30" />
                  )}
                </div>
                
                {/* Active tab background glow */}
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-primary/5 via-primary/3 to-transparent pointer-events-none" />
                )}
                
                {/* Ripple effect container */}
                <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                  {isCurrentPressed && (
                    <div className="absolute inset-0 bg-primary/20 rounded-xl opacity-60" />
                  )}
                </div>
              </NavLink>
            );
          })}
        </div>
      </div>
      
      {/* Bottom safe area */}
      <div className="h-safe-area-inset-bottom bg-gradient-to-t from-background via-background/95 to-transparent" />
    </nav>
  );
};

export default MobileTabNavigation;
