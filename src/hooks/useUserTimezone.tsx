import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getBrowserTimezone } from '@/utils/timezoneUtils';

/**
 * Hook to get and manage user's timezone
 * Provides the current user's timezone for use with timezone utility functions
 */
export const useUserTimezone = () => {
  const { user } = useAuth();
  const [timezone, setTimezone] = useState<string>(getBrowserTimezone());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserTimezone = async () => {
      if (!user) {
        setTimezone(getBrowserTimezone());
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('profiles')
          .select('timezone')
          .eq('id' as any, user.id as any)
          .single();

        if ((data as any)?.timezone) {
          setTimezone((data as any).timezone);
        } else {
          // Fallback to browser timezone
          const browserTimezone = getBrowserTimezone();
          setTimezone(browserTimezone);
          
          // Update user's profile with browser timezone
          await supabase
            .from('profiles')
            .update({ timezone: browserTimezone } as any)
            .eq('id' as any, user.id as any);
        }
      } catch (error) {
        console.warn('Failed to fetch user timezone:', error);
        setTimezone(getBrowserTimezone());
      } finally {
        setLoading(false);
      }
    };

    fetchUserTimezone();
  }, [user]);

  return { timezone, loading };
};