import React from 'react';
import { Crown, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface ReminderLimitBannerProps {
  current: number;
  limit: number | 'unlimited';
  isInTrial: boolean;
  trialDays: number;
  onUpgrade: () => void;
}

export function ReminderLimitBanner({ 
  current, 
  limit, 
  isInTrial, 
  trialDays, 
  onUpgrade 
}: ReminderLimitBannerProps) {
  const { subscription } = useSubscription();

  // Don't show banner if unlimited or well under limit
  if (limit === 'unlimited' || (typeof limit === 'number' && current < limit - 1)) {
    return null;
  }

  // Trial ending soon warning
  if (isInTrial && trialDays <= 3) {
    return (
      <Card className="mx-4 mb-4 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-300">
                  <Clock className="w-3 h-3 mr-1" />
                  {trialDays} day{trialDays === 1 ? '' : 's'} left
                </Badge>
              </div>
              <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                Trial ending soon
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                You have {current} reminder{current === 1 ? '' : 's'}. After trial: limited to 1 reminder.
              </p>
              <Button 
                size="sm" 
                onClick={onUpgrade}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                <Crown className="w-4 h-4 mr-2" />
                Keep unlimited reminders
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // At or near limit warning
  if (typeof limit === 'number' && current >= limit) {
    return (
      <Card className="mx-4 mb-4 border-primary/20 bg-gradient-to-r from-primary/5 to-primary-glow/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="border-primary/30">
                  {current} of {limit} reminders
                </Badge>
                {subscription.plan === 'free' && (
                  <Badge variant="secondary">Free Plan</Badge>
                )}
              </div>
              <h4 className="font-medium text-foreground mb-1">
                You've reached your reminder limit
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Free users get 1 reminder. Upgrade to Pro for unlimited reminders.
              </p>
              <Button 
                size="sm" 
                onClick={onUpgrade}
                className="bg-gradient-to-r from-primary to-primary-glow"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}