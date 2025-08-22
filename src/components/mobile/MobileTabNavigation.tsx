import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, History, Pill, Users, Bell, Scan } from 'lucide-react';
import { TranslatedText } from '@/components/TranslatedText';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    icon: Home,
    label: 'navigation.home',
    href: '/',
  },
  {
    icon: History,
    label: 'navigation.history',
    href: '/history',
  },
  {
    icon: Pill,
    label: 'navigation.medications',
    href: '/medications',
  },
  {
    icon: Bell,
    label: 'navigation.reminders',
    href: '/reminders',
  },
  {
    icon: Users,
    label: 'navigation.family',
    href: '/family',
  },
];

const MobileTabNavigation: React.FC = () => {
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const currentIndex = navigationItems.findIndex(item => item.href === location.pathname);
    if (currentIndex !== -1) {
      setActiveIndex(currentIndex);
    }
  }, [location.pathname]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 medical-surface border-t border-border/20 safe-area-bottom backdrop-blur-xl">
      {/* Floating Action Button Spacer */}
      <div className="h-2" />
      
      {/* Navigation Content */}
      <div className="relative px-4 py-3">
        {/* Active Tab Indicator */}
        <div 
          className="absolute top-0 h-1 bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-300 ease-out"
          style={{
            left: `${(activeIndex / navigationItems.length) * 100}%`,
            width: `${100 / navigationItems.length}%`,
            marginLeft: '1rem',
            marginRight: '1rem'
          }}
        />
        
        <div className="flex items-center justify-around">
          {navigationItems.map((item, index) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-2xl transition-all duration-300 touch-target min-w-0 flex-1 relative group",
                  "hover:scale-105 active:scale-95",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveIndex(index)}
              >
                {/* Icon with enhanced animation */}
                <div className={cn(
                  "relative p-2 rounded-xl transition-all duration-300",
                  isActive 
                    ? "bg-primary/15 shadow-primary/20 shadow-lg scale-110" 
                    : "group-hover:bg-muted/60"
                )}>
                  <Icon className={cn(
                    "w-5 h-5 flex-shrink-0 transition-all duration-300",
                    isActive && "animate-medical-pulse"
                  )} />
                  
                  {/* Pulse effect for active tab */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-xl bg-primary/20 animate-ping" />
                  )}
                </div>
                
                {/* Label with enhanced typography */}
                <span className={cn(
                  "text-xs font-medium truncate max-w-full transition-all duration-300",
                  isActive 
                    ? "text-primary font-semibold" 
                    : "text-muted-foreground group-hover:text-foreground"
                )}>
                  <TranslatedText translationKey={item.label} />
                </span>
                
                {/* Active tab background glow */}
                {isActive && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
      
      {/* Bottom safe area with gradient */}
      <div className="h-safe-area-inset-bottom bg-gradient-to-t from-background/50 to-transparent" />
    </nav>
  );
};

export default MobileTabNavigation;