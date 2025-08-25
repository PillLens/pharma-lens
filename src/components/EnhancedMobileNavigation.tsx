import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Home, History, Pill, Users, Bell, Shield, LogOut, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { TranslatedText } from '@/components/TranslatedText';
import { useTranslation } from '@/hooks/useTranslation';

const EnhancedMobileNavigation = () => {
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

  // Fix double-touch issue by handling touch events directly
  const handleMenuToggle = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const navigationItems = [
    { icon: Home, labelKey: 'navigation.scanner', href: '/', descriptionKey: 'descriptions.scanMedications' },
    { icon: History, labelKey: 'navigation.history', href: '/history', descriptionKey: 'descriptions.viewHistory' },
    { icon: Pill, labelKey: 'navigation.medications', href: '/medications', descriptionKey: 'descriptions.manageMedications' },
    { icon: Users, labelKey: 'navigation.family', href: '/family', descriptionKey: 'descriptions.familyCaregivers' },
    { icon: Bell, labelKey: 'navigation.reminders', href: '/reminders', descriptionKey: 'descriptions.medicationReminders' },
    { icon: Shield, labelKey: 'navigation.security', href: '/security', descriptionKey: 'descriptions.securityDashboard' },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden p-2 touch-target glass hover-glow-desktop transition-all duration-300 relative z-50"
        aria-label="Open menu"
        onClick={handleMenuToggle}
        onTouchStart={handleMenuToggle}
      >
        <Menu className="h-6 w-6 text-primary" />
      </Button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsOpen(false)}
            onTouchStart={() => setIsOpen(false)}
          />
          
          {/* Menu Content */}
          <div className="fixed inset-x-0 bottom-0 top-16 bg-background/95 backdrop-blur-xl border-t border-border/30 z-40 md:hidden animate-slide-up">
            <div className="h-full overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-glow">
                    <div className="w-5 h-5 bg-white rounded-sm" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      <TranslatedText translationKey="app.title" />
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      <TranslatedText translationKey="navigation.medicationGuide" />
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-2 touch-target"
                  onClick={() => setIsOpen(false)}
                  onTouchStart={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Navigation */}
              <div className="px-6 py-6">
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
                              : 'glass hover-bg-desktop hover-shadow-desktop text-foreground active:bg-accent/50'
                          }`}
                          onClick={() => setIsOpen(false)}
                          onTouchStart={() => setIsOpen(false)}
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
                              <span className="font-semibold text-base">
                                <TranslatedText translationKey={item.labelKey} />
                              </span>
                              <p className={`text-xs ${
                                isActive ? 'text-white/80' : 'text-muted-foreground'
                              }`}>
                                <TranslatedText translationKey={item.descriptionKey} />
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
                
                {/* Sign Out */}
                <div className="mt-8 pt-6 border-t border-border/20">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-4 text-destructive hover:text-destructive hover-bg-desktop p-4 rounded-2xl touch-target transition-all duration-300 active:bg-destructive/5"
                    onClick={handleSignOut}
                    onTouchStart={handleSignOut}
                  >
                    <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                      <LogOut className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <span className="font-semibold text-base">
                        <TranslatedText translationKey="navigation.signOut" />
                      </span>
                      <p className="text-xs text-muted-foreground">
                        <TranslatedText translationKey="navigation.endSession" />
                      </p>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default EnhancedMobileNavigation;