import React from 'react';
import { Camera, Mic, Heart, Plus, X, Scan, Zap } from 'lucide-react';
import { MobileButton } from '@/components/ui/mobile/MobileButton';
import { TranslatedText } from '@/components/TranslatedText';

interface EnhancedFABProps {
  onScanPress: () => void;
  onVoicePress: () => void;
  onEmergencyPress: () => void;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
}

const EnhancedFAB: React.FC<EnhancedFABProps> = ({
  onScanPress,
  onVoicePress,
  onEmergencyPress,
  isMenuOpen,
  onMenuToggle
}) => {
  const fabActions = [
    {
      icon: Camera,
      label: 'Scan',
      onClick: onScanPress,
      variant: 'scan' as const,
      className: 'bg-primary hover:bg-primary-glow text-white shadow-medical'
    },
    {
      icon: Mic,
      label: 'Voice Search',
      onClick: onVoicePress,
      variant: 'secondary' as const,
      className: 'bg-info hover:bg-info/90 text-white shadow-medical'
    },
    {
      icon: Heart,
      label: 'Emergency',
      onClick: onEmergencyPress,
      variant: 'emergency' as const,
      className: 'bg-emergency hover:bg-emergency/90 text-white shadow-emergency animate-pulse'
    }
  ];

  return (
    <>
      {/* Backdrop */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onMenuToggle}
        />
      )}

      {/* FAB Menu Actions */}
      <div className="fixed bottom-20 right-4 z-50 flex flex-col-reverse gap-3">
        {isMenuOpen && fabActions.map((action, index) => (
          <div
            key={action.label}
            className={`transform transition-all duration-300 ${
              isMenuOpen 
                ? 'translate-y-0 opacity-100 scale-100' 
                : 'translate-y-4 opacity-0 scale-95'
            }`}
            style={{ transitionDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-card">
                <span className="text-sm font-medium text-foreground whitespace-nowrap">
                  <TranslatedText 
                    translationKey={`fab.${action.label.toLowerCase().replace(/\s+/g, '')}`} 
                    fallback={action.label} 
                  />
                </span>
              </div>
              <MobileButton
                size="lg"
                variant={action.variant}
                onClick={() => {
                  action.onClick();
                  onMenuToggle();
                }}
                className={`w-14 h-14 rounded-full shadow-floating hover:scale-110 transition-all duration-200 ${action.className}`}
                haptic
              >
                <action.icon className="w-6 h-6" />
              </MobileButton>
            </div>
          </div>
        ))}
      </div>

      {/* Main FAB Toggle */}
      <div className="fixed bottom-4 right-4 z-50">
        <MobileButton
          size="xl"
          onClick={onMenuToggle}
          className={`w-16 h-16 rounded-full shadow-floating hover:scale-110 transition-all duration-300 ${
            isMenuOpen 
              ? 'bg-destructive hover:bg-destructive/90 text-white rotate-45' 
              : 'bg-primary hover:bg-primary-glow text-white rotate-0'
          }`}
          haptic
        >
          {isMenuOpen ? (
            <X className="w-7 h-7" />
          ) : (
            <div className="relative">
              <Plus className="w-7 h-7" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-warning rounded-full animate-ping" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-warning rounded-full" />
            </div>
          )}
        </MobileButton>
      </div>
    </>
  );
};

export default EnhancedFAB;