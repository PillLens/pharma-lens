import React, { useState } from 'react';
import { Crown, X, Star, Sparkles, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TranslatedText } from '@/components/TranslatedText';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { PaywallSheet } from './PaywallSheet';
import { cn } from '@/lib/utils';

export function TrialBanner() {
  const { trialDaysRemaining, subscription } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !trialDaysRemaining) {
    return null;
  }

  const getUrgencyStyles = () => {
    if (trialDaysRemaining <= 3) {
      return {
        cardClass: 'border-red-400/30 bg-gradient-to-br from-red-500/5 via-red-400/10 to-red-500/5',
        badgeClass: 'bg-red-500/10 text-red-700 border-red-400/30',
        textClass: 'text-red-700',
        iconBg: 'from-red-500 to-red-600',
        glowClass: 'shadow-red-500/20'
      };
    }
    if (trialDaysRemaining <= 7) {
      return {
        cardClass: 'border-amber-400/30 bg-gradient-to-br from-amber-500/5 via-amber-400/10 to-amber-500/5',
        badgeClass: 'bg-amber-500/10 text-amber-700 border-amber-400/30',
        textClass: 'text-amber-700',
        iconBg: 'from-amber-500 to-orange-500',
        glowClass: 'shadow-amber-500/20'
      };
    }
    return {
      cardClass: 'border-blue-400/30 bg-gradient-to-br from-blue-500/5 via-blue-400/10 to-blue-500/5',
      badgeClass: 'bg-blue-500/10 text-blue-700 border-blue-400/30',
      textClass: 'text-blue-700',
      iconBg: 'from-blue-500 to-blue-600',
      glowClass: 'shadow-blue-500/20'
    };
  };

  const urgencyStyles = getUrgencyStyles();

  return (
    <>
      <Card className={cn(
        "mx-4 backdrop-blur-sm shadow-xl overflow-hidden relative",
        urgencyStyles.cardClass,
        urgencyStyles.glowClass,
        trialDaysRemaining <= 3 && "animate-glow-pulse"
      )}>
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-gradient-shift opacity-30" />
        
        {/* Floating sparkles for urgency */}
        {trialDaysRemaining <= 3 && (
          <div className="absolute top-2 right-2">
            <Sparkles className="w-4 h-4 text-red-400 animate-pulse" />
          </div>
        )}

        <CardContent className="p-5 relative z-10">
          <div className="flex items-start gap-4">
            {/* Enhanced icon container */}
            <div className={cn(
              "flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg relative overflow-hidden",
              urgencyStyles.iconBg
            )}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              <Crown className="w-6 h-6 text-white drop-shadow-sm relative z-10" />
              {trialDaysRemaining <= 3 && (
                <div className="absolute inset-0 bg-white/20 animate-pulse rounded-2xl" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Enhanced header with better spacing */}
              <div className="flex items-center gap-3 mb-2">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs font-semibold border px-3 py-1 shadow-sm",
                    urgencyStyles.badgeClass
                  )}
                >
                  <Star className="w-3 h-3 mr-1" />
                  <TranslatedText translationKey="subscription.trial" fallback="Trial" />
                </Badge>
                
                <div className="flex items-center gap-1">
                  <Clock className={cn("w-4 h-4", urgencyStyles.textClass)} />
                  <span className={cn("text-sm font-bold", urgencyStyles.textClass)}>
                    <TranslatedText 
                      translationKey="dashboard.daysRemaining" 
                      fallback={`${trialDaysRemaining} days left`}
                    />
                  </span>
                </div>
              </div>
              
              {/* Enhanced description */}
              <div className="mb-4">
                <p className={cn("text-sm font-medium leading-relaxed", urgencyStyles.textClass)}>
                  {trialDaysRemaining <= 3 ? (
                    <TranslatedText 
                      translationKey="subscription.trialEndingSoon" 
                      fallback="⚡ Your trial expires soon! Upgrade now to keep all premium features." 
                    />
                  ) : (
                    <TranslatedText 
                      translationKey="subscription.trialActive" 
                      fallback="🚀 Enjoying premium features? Upgrade to continue seamlessly after your trial." 
                    />
                  )}
                </p>
              </div>

              {/* Enhanced action buttons */}
              <div className="flex gap-3">
                <Button 
                  size="sm" 
                  onClick={() => setShowUpgrade(true)}
                  className={cn(
                    "bg-gradient-to-r text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] px-4 py-2",
                    urgencyStyles.iconBg.replace('from-', 'from-').replace('to-', 'to-')
                  )}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  <TranslatedText translationKey="subscription.upgrade" fallback="Upgrade Now" />
                </Button>
                
                {trialDaysRemaining > 3 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setDismissed(true)}
                    className={cn(
                      "hover:bg-white/10 transition-all duration-200",
                      urgencyStyles.textClass
                    )}
                  >
                    <TranslatedText translationKey="common.dismiss" fallback="Maybe later" />
                  </Button>
                )}
              </div>
            </div>

            {/* Enhanced close button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
              className="flex-shrink-0 w-8 h-8 p-0 hover:bg-white/10 transition-all duration-200 rounded-full"
            >
              <X className="w-4 h-4 opacity-60 hover:opacity-100 transition-opacity" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <PaywallSheet 
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
      />
    </>
  );
}