import React from 'react';
import { Pill, Bell, Users, Heart, Calendar, Shield, Stethoscope, PlusCircle } from 'lucide-react';
import { MobileButton } from '@/components/ui/mobile/MobileButton';
import { MobileCard, MobileCardContent } from '@/components/ui/mobile/MobileCard';
import { cn } from '@/lib/utils';
import { TranslatedText } from '@/components/TranslatedText';

interface EmptyStateIllustrationProps {
  type: 'medications' | 'reminders' | 'family' | 'scans' | 'health';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyStateIllustration: React.FC<EmptyStateIllustrationProps> = ({
  type,
  title,
  description,
  actionLabel,
  onAction,
  className
}) => {
  const getIllustrationConfig = () => {
    switch (type) {
      case 'medications':
        return {
          icon: Pill,
          bgGradient: 'from-success/20 via-success/10 to-transparent',
          iconColor: 'text-success',
          iconBg: 'bg-success/20',
          defaultTitle: 'No Medications Added',
          defaultDescription: 'Start by adding your current medications to track interactions and ensure safety.',
          defaultAction: 'Add Your First Medication'
        };
      case 'reminders':
        return {
          icon: Bell,
          bgGradient: 'from-warning/20 via-warning/10 to-transparent',
          iconColor: 'text-warning',
          iconBg: 'bg-warning/20',
          defaultTitle: 'No Reminders Set',
          defaultDescription: 'Set up medication reminders to help you stay on track with your treatment.',
          defaultAction: 'Create First Reminder'
        };
      case 'family':
        return {
          icon: Users,
          bgGradient: 'from-info/20 via-info/10 to-transparent',
          iconColor: 'text-info',
          iconBg: 'bg-info/20',
          defaultTitle: 'No Family Members',
          defaultDescription: 'Invite family members or caregivers to help manage medications together.',
          defaultAction: 'Add Family Member'
        };
      case 'scans':
        return {
          icon: Shield,
          bgGradient: 'from-primary/20 via-primary/10 to-transparent',
          iconColor: 'text-primary',
          iconBg: 'bg-primary/20',
          defaultTitle: 'No Scans Yet',
          defaultDescription: 'Start scanning medication labels to get instant safety information.',
          defaultAction: 'Start Scanning'
        };
      case 'health':
        return {
          icon: Heart,
          bgGradient: 'from-destructive/20 via-destructive/10 to-transparent',
          iconColor: 'text-destructive',
          iconBg: 'bg-destructive/20',
          defaultTitle: 'No Health Data',
          defaultDescription: 'Track your health metrics and medication compliance over time.',
          defaultAction: 'View Health Dashboard'
        };
    }
  };

  const config = getIllustrationConfig();
  const Icon = config.icon;

  return (
    <MobileCard className={cn('text-center', className)}>
      <MobileCardContent className="p-8">
        {/* Animated Background */}
        <div className={cn(
          'relative mx-auto mb-6 w-32 h-32 rounded-full bg-gradient-to-br',
          config.bgGradient,
          'flex items-center justify-center overflow-hidden'
        )}>
          {/* Floating circles animation */}
          <div className="absolute inset-0">
            <div className="absolute top-4 left-4 w-3 h-3 bg-white/20 rounded-full animate-bounce" 
                 style={{ animationDelay: '0s', animationDuration: '2s' }} />
            <div className="absolute top-8 right-6 w-2 h-2 bg-white/30 rounded-full animate-bounce" 
                 style={{ animationDelay: '0.5s', animationDuration: '2.5s' }} />
            <div className="absolute bottom-6 left-8 w-2 h-2 bg-white/25 rounded-full animate-bounce" 
                 style={{ animationDelay: '1s', animationDuration: '2.2s' }} />
            <div className="absolute bottom-4 right-4 w-3 h-3 bg-white/20 rounded-full animate-bounce" 
                 style={{ animationDelay: '1.5s', animationDuration: '2.8s' }} />
          </div>
          
          {/* Medical cross pattern */}
          <div className="absolute inset-4 opacity-10">
            <Stethoscope className="w-full h-full text-white" />
          </div>
          
          {/* Main icon */}
          <div className={cn(
            'relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center shadow-card',
            config.iconBg,
            'animate-pulse'
          )}>
            <Icon className={cn('w-8 h-8', config.iconColor)} />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-foreground">
            <TranslatedText 
              translationKey={`emptyState.${type}.title`} 
              fallback={title || config.defaultTitle} 
            />
          </h3>
          
          <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
            <TranslatedText 
              translationKey={`emptyState.${type}.description`} 
              fallback={description || config.defaultDescription} 
            />
          </p>

          {/* Contextual Help */}
          {type === 'medications' && (
            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">
                  <TranslatedText translationKey="emptyState.medications.safety" fallback="Safety First" />
                </p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-warning" />
                </div>
                <p className="text-xs text-muted-foreground">
                  <TranslatedText translationKey="emptyState.medications.reminders" fallback="Smart Reminders" />
                </p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-info/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-info" />
                </div>
                <p className="text-xs text-muted-foreground">
                  <TranslatedText translationKey="emptyState.medications.family" fallback="Family Care" />
                </p>
              </div>
            </div>
          )}

          {/* Action Button */}
          {onAction && (
            <div className="pt-4">
              <MobileButton
                onClick={onAction}
                className="w-full max-w-xs mx-auto"
                size="lg"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                <TranslatedText 
                  translationKey={`emptyState.${type}.action`} 
                  fallback={actionLabel || config.defaultAction} 
                />
              </MobileButton>
            </div>
          )}

          {/* Getting Started Tips */}
          {type === 'medications' && (
            <div className="pt-6 border-t border-border">
              <p className="text-sm font-medium text-muted-foreground mb-3">
                <TranslatedText translationKey="emptyState.gettingStarted" fallback="Getting Started Tips:" />
              </p>
              <div className="text-left space-y-2 max-w-sm mx-auto">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>
                    <TranslatedText 
                      translationKey="emptyState.tip1" 
                      fallback="Scan medication labels for quick entry" 
                    />
                  </span>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>
                    <TranslatedText 
                      translationKey="emptyState.tip2" 
                      fallback="Include dosage and frequency details" 
                    />
                  </span>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-forerence">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>
                    <TranslatedText 
                      translationKey="emptyState.tip3" 
                      fallback="Set up reminders for better compliance" 
                    />
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </MobileCardContent>
    </MobileCard>
  );
};

export default EmptyStateIllustration;