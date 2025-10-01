import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface AIChatUsage {
  canChat: boolean;
  minutesUsed: number;
  minutesLimit: number;
  minutesRemaining: number;
  isUnlimited: boolean;
  loading: boolean;
  error: string | null;
}

export function useAIChatUsage() {
  const { user } = useAuth();
  const { entitlements } = useSubscription();
  const [usage, setUsage] = useState<AIChatUsage>({
    canChat: true,
    minutesUsed: 0,
    minutesLimit: 10,
    minutesRemaining: 10,
    isUnlimited: false,
    loading: true,
    error: null
  });

  const checkUsage = async () => {
    if (!user) {
      setUsage({
        canChat: false,
        minutesUsed: 0,
        minutesLimit: 0,
        minutesRemaining: 0,
        isUnlimited: false,
        loading: false,
        error: 'Not authenticated'
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('track-ai-chat-usage', {
        body: { action: 'check' }
      });

      if (error) throw error;

      setUsage({
        ...data,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error checking AI chat usage:', error);
      setUsage(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to check usage'
      }));
    }
  };

  const trackUsage = async (minutes: number) => {
    if (!user) return;

    try {
      const { error } = await supabase.functions.invoke('track-ai-chat-usage', {
        body: { action: 'track', minutes }
      });

      if (error) throw error;

      // Refresh usage after tracking
      await checkUsage();
    } catch (error) {
      console.error('Error tracking AI chat usage:', error);
    }
  };

  useEffect(() => {
    checkUsage();
  }, [user?.id, entitlements]);

  return {
    ...usage,
    checkUsage,
    trackUsage
  };
}
