import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { entitlementsService } from '@/services/entitlementsService';

export interface ReminderLimitInfo {
  current: number;
  limit: number | 'unlimited';
  isInTrial: boolean;
  trialDays: number;
  canCreate: boolean;
  plan: 'free' | 'pro_individual';
  percentageUsed: number;
  isAtLimit: boolean;
  isNearLimit: boolean;
}

export function useReminderLimits(currentCount: number) {
  const { user } = useAuth();
  const { isInTrial, trialDaysRemaining, subscription } = useSubscription();
  const [limitInfo, setLimitInfo] = useState<ReminderLimitInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLimitInfo = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const entitlements = await entitlementsService.getUserEntitlements(user.id);
      const limit = entitlements.reminders_limit;
      const isUnlimited = limit === -1;
      const effectiveLimit = isUnlimited ? 'unlimited' : limit;
      
      const canCreate = isUnlimited || isInTrial || currentCount < limit;
      const percentageUsed = isUnlimited ? 0 : Math.min((currentCount / limit) * 100, 100);
      const isAtLimit = !isUnlimited && currentCount >= limit;
      const isNearLimit = !isUnlimited && currentCount >= limit - 1;

      setLimitInfo({
        current: currentCount,
        limit: effectiveLimit,
        isInTrial,
        trialDays: trialDaysRemaining,
        canCreate,
        plan: subscription.plan,
        percentageUsed,
        isAtLimit,
        isNearLimit
      });
    } catch (error) {
      console.error('Error fetching reminder limits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLimitInfo();
  }, [user?.id, currentCount, isInTrial, trialDaysRemaining, subscription.plan]);

  const canCreateReminder = async () => {
    if (!user || !limitInfo) {
      return { allowed: false, reason: 'User not authenticated or limits not loaded' };
    }

    if (limitInfo.canCreate) {
      return { allowed: true, reason: '' };
    }

    if (limitInfo.isAtLimit) {
      return {
        allowed: false,
        reason: `You've reached your limit of ${limitInfo.limit} reminder${limitInfo.limit === 1 ? '' : 's'}. Upgrade to Pro for unlimited reminders.`
      };
    }

    return { allowed: true, reason: '' };
  };

  return {
    limitInfo,
    loading,
    canCreateReminder,
    refetch: fetchLimitInfo
  };
}