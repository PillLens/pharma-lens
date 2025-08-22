import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Home, History, Pill, Users, Bell, Shield, LogOut, ChevronRight } from 'lucide-react';
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

const EnhancedMobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/auth');
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const navigationItems = [
    { icon: Home, label: 'Scanner', href: '/', description: 'Scan medications' },
    { icon: History, label: 'History', href: '/history', description: 'View scan history' },
    { icon: Pill, label: 'Medications', href: '/medications', description: 'Manage medications' },
    { icon: Users, label: 'Family', href: '/family', description: 'Family & caregivers' },
    { icon: Bell, label: 'Reminders', href: '/reminders', description: 'Medication reminders' },
    { icon: Shield, label: 'Security', href: '/security', description: 'Security dashboard' },
  ];

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden p-2 touch-target glass hover:shadow-glow transition-all duration-300"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6 text-primary" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[90vh] glass-card border-t border-border/30">
        <DrawerHeader className="text-left border-b border-border/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-glow">
                <div className="w-5 h-5 bg-white rounded-sm" />
              </div>
              <div>
                <DrawerTitle className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  PharmaLens
                </DrawerTitle>
                <p className="text-xs text-muted-foreground">Medication Guide</p>
              </div>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm" className="p-2 touch-target hover:bg-destructive/10 hover:text-destructive transition-all duration-300">
                <X className="h-5 w-5" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>
        
        <div className="px-6 py-6 smooth-scroll">
          <nav className="space-y-3">
            {navigationItems.map((item, index) => {
              const isActive = location.pathname === item.href;
              return (
                <div
                  key={item.href}
                  className="animate-slide-in-right"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Link
                    to={item.href}
                    className={`group flex items-center justify-between p-4 rounded-2xl transition-all duration-300 touch-target ${
                      isActive
                        ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-medical'
                        : 'glass hover:shadow-card hover:scale-[1.02] text-foreground'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isActive 
                          ? 'bg-white/20' 
                          : 'bg-primary/10 group-hover:bg-primary/20'
                      }`}>
                        <item.icon className={`h-5 w-5 ${
                          isActive ? 'text-white' : 'text-primary'
                        }`} />
                      </div>
                      <div>
                        <span className="font-semibold text-base">{item.label}</span>
                        <p className={`text-xs ${
                          isActive ? 'text-white/80' : 'text-muted-foreground'
                        }`}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={`h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 ${
                      isActive ? 'text-white/80' : 'text-muted-foreground'
                    }`} />
                  </Link>
                </div>
              );
            })}
          </nav>
          
          <div className="mt-8 pt-6 border-t border-border/20 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <Button
              variant="ghost"
              className="w-full justify-start gap-4 text-destructive hover:text-destructive hover:bg-destructive/10 p-4 rounded-2xl touch-target transition-all duration-300 hover:scale-[1.02]"
              onClick={handleSignOut}
            >
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <LogOut className="h-5 w-5" />
              </div>
              <div className="text-left">
                <span className="font-semibold text-base">Sign Out</span>
                <p className="text-xs text-muted-foreground">End your session</p>
              </div>
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default EnhancedMobileNavigation;