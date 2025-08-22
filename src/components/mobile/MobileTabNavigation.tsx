import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, History, Pill, Users, Bell } from 'lucide-react';
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors touch-target min-w-0 flex-1",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-xs font-medium truncate max-w-full">
                <TranslatedText translationKey={item.label} />
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileTabNavigation;