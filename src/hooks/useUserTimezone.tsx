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
          .eq('id', user.id)
          .single();

        if (data?.timezone) {
          setTimezone(data.timezone);
        } else {
          // Fallback to browser timezone
          const browserTimezone = getBrowserTimezone();
          setTimezone(browserTimezone);
          
          // Update user's profile with browser timezone
          await supabase
            .from('profiles')
            .update({ timezone: browserTimezone })
            .eq('id', user.id);
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