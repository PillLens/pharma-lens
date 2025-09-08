import React, { useState, useEffect } from 'react';
import { Crown, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useReminders } from '@/hooks/useReminders';
import { useSubscription } from '@/contexts/SubscriptionContext';

export function ReminderUsageIndicator() {
  const { reminders, getReminderLimitInfo } = useReminders();
  const { isInTrial, trialDaysRemaining } = useSubscription();
  const [limitInfo, setLimitInfo] = useState<any>(null);

  useEffect(() => {
    const fetchLimitInfo = async () => {
      const info = await getReminderLimitInfo();
      setLimitInfo(info);
    };
    
    fetchLimitInfo();
  }, [reminders.length, getReminderLimitInfo]);

  if (!limitInfo) return null;

  const { current, limit, plan } = limitInfo;
  
  // Don't show for unlimited plans (unless in trial)
  if (limit === 'unlimited' && !isInTrial) {
    return null;
  }

  const isAtLimit = typeof limit === 'number' && current >= limit;
  const isNearLimit = typeof limit === 'number' && current >= limit - 1;
  const progressValue = typeof limit === 'number' ? (current / limit) * 100 : 0;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {current} of {limit === 'unlimited' ? '∞' : limit} reminders
          </span>
        </div>

        {isInTrial && (
          <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
            <Crown className="w-3 h-3 mr-1" />
            Trial: {trialDaysRemaining} days left
          </Badge>
        )}

        {plan === 'free' && !isInTrial && (
          <Badge variant="outline" className="text-xs">
            Free Plan
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isNearLimit && typeof limit === 'number' && (
          <AlertCircle className="w-4 h-4 text-amber-500" />
        )}
        
        {typeof limit === 'number' && (
          <div className="w-16">
            <Progress 
              value={Math.min(progressValue, 100)} 
              className="h-2"
            />
          </div>
        )}
      </div>
    </div>
  );
}