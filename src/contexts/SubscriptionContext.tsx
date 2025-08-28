import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { entitlementsService, UserEntitlements, UserSubscription } from '@/services/entitlementsService';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionContextType {
  entitlements: UserEntitlements;
  subscription: UserSubscription;
  loading: boolean;
  refreshEntitlements: () => Promise<void>;
  checkFeatureAccess: (feature: keyof UserEntitlements) => boolean;
  isInTrial: boolean;
  trialDaysRemaining: number;
  canStartTrial: boolean;
  upgradeUrl: string | null;
  manageUrl: string | null;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const { user, loading: authLoading } = useAuth();
  const [entitlements, setEntitlements] = useState<UserEntitlements>(entitlementsService['getDefaultEntitlements']());
  const [subscription, setSubscription] = useState<UserSubscription>(entitlementsService['getDefaultSubscription']());
  const [loading, setLoading] = useState(true);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);
  const [canStartTrial, setCanStartTrial] = useState(true);
  const [upgradeUrl, setUpgradeUrl] = useState<string | null>(null);
  const [manageUrl, setManageUrl] = useState<string | null>(null);

  const refreshEntitlements = async () => {
    if (!user?.id) {
      setEntitlements(entitlementsService['getDefaultEntitlements']());
      setSubscription(entitlementsService['getDefaultSubscription']());
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Clear cache to get fresh data
      entitlementsService.clearCache(user.id);
      
      const [userEntitlements, userSubscription, remainingDays, canTrial] = await Promise.all([
        entitlementsService.getUserEntitlements(user.id),
        entitlementsService.getUserSubscription(user.id),
        entitlementsService.getRemainingTrialDays(user.id),
        entitlementsService.canStartTrial(user.id)
      ]);

      setEntitlements(userEntitlements);
      setSubscription(userSubscription);
      setTrialDaysRemaining(remainingDays);
      setCanStartTrial(canTrial);
    } catch (error) {
      console.error('Error refreshing entitlements:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFeatureAccess = (feature: keyof UserEntitlements): boolean => {
    return !!entitlements[feature];
  };

  const isInTrial = subscription.status === 'trialing';

  // Load entitlements when user changes
  useEffect(() => {
    if (!authLoading) {
      refreshEntitlements();
    }
  }, [user?.id, authLoading]);

  // Auto-refresh entitlements periodically
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      refreshEntitlements();
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, [user?.id]);

  // Listen to subscription changes from webhooks
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Subscription changed, refresh entitlements
          setTimeout(refreshEntitlements, 1000); // Small delay to ensure webhook processing
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        () => {
          // Profile updated (trial status, plan, etc.)
          setTimeout(refreshEntitlements, 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const value: SubscriptionContextType = {
    entitlements,
    subscription,
    loading: loading || authLoading,
    refreshEntitlements,
    checkFeatureAccess,
    isInTrial,
    trialDaysRemaining,
    canStartTrial,
    upgradeUrl,
    manageUrl
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    console.error('useSubscription called outside SubscriptionProvider. Stack trace:', new Error().stack);
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}