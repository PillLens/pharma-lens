import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Home, History, Pill, Users, Bell, Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from '@/components/ui/drawer';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { TranslatedText } from '@/components/TranslatedText';
import { useTranslation } from '@/hooks/useTranslation';

const MobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { t } = useTranslation();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success(t('auth.signOutSuccess'));
      navigate('/auth');
      setIsOpen(false);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const navigationItems = [
    { icon: Home, labelKey: 'navigation.scanner', href: '/' },
    { icon: History, labelKey: 'navigation.history', href: '/history' },
    { icon: Pill, labelKey: 'navigation.medications', href: '/medications' },
    { icon: Users, labelKey: 'navigation.family', href: '/family' },
    { icon: Bell, labelKey: 'navigation.reminders', href: '/reminders' },
    { icon: Shield, labelKey: 'navigation.security', href: '/security' },
  ];

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden p-2"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[85vh]">
        <DrawerHeader className="text-left">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-xl font-bold text-primary">
              <TranslatedText translationKey="app.title" />
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <X className="h-5 w-5" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>
        
        <div className="px-4 pb-6">
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">
                    <TranslatedText translationKey={item.labelKey} />
                  </span>
                </Link>
              );
            })}
          </nav>
          
          <div className="mt-8 pt-6 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              <TranslatedText translationKey="navigation.signOut" />
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileNavigation;