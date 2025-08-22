import React, { useState } from 'react';
import { Crown, X, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TranslatedText } from '@/components/TranslatedText';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { PaywallSheet } from './PaywallSheet';

export function TrialBanner() {
  const { trialDaysRemaining, subscription } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !trialDaysRemaining) {
    return null;
  }

  const getUrgencyColor = () => {
    if (trialDaysRemaining <= 3) return 'bg-red-50 border-red-200';
    if (trialDaysRemaining <= 7) return 'bg-amber-50 border-amber-200';
    return 'bg-blue-50 border-blue-200';
  };

  const getUrgencyTextColor = () => {
    if (trialDaysRemaining <= 3) return 'text-red-800';
    if (trialDaysRemaining <= 7) return 'text-amber-800';
    return 'text-blue-800';
  };

  return (
    <>
      <Card className={`mx-4 ${getUrgencyColor()}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs">
                  <TranslatedText translationKey="subscription.trial" fallback="Trial" />
                </Badge>
                <span className={`text-sm font-semibold ${getUrgencyTextColor()}`}>
                  <TranslatedText 
                    translationKey="dashboard.daysRemaining" 
                    fallback={`${trialDaysRemaining} days remaining`}
                  />
                </span>
              </div>
              
              <p className={`text-sm ${getUrgencyTextColor()} mb-3`}>
                {trialDaysRemaining <= 3 ? (
                  <TranslatedText 
                    translationKey="subscription.trialEndingSoon" 
                    fallback="Your trial is ending soon! Upgrade to keep your premium features." 
                  />
                ) : (
                  <TranslatedText 
                    translationKey="subscription.trialActive" 
                    fallback="You're enjoying all Pro Individual features. Upgrade to continue after your trial." 
                  />
                )}
              </p>

              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => setShowUpgrade(true)}
                  className="bg-gradient-to-r from-primary to-primary-glow"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  <TranslatedText translationKey="subscription.upgrade" fallback="Upgrade Now" />
                </Button>
                
                {trialDaysRemaining > 3 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setDismissed(true)}
                    className={getUrgencyTextColor()}
                  >
                    <TranslatedText translationKey="common.dismiss" fallback="Dismiss" />
                  </Button>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
              className="flex-shrink-0 w-8 h-8 p-0"
            >
              <X className="w-4 h-4" />
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