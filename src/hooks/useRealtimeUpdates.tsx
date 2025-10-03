import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface UseRealtimeUpdatesProps {
  onUpdate?: () => void;
  tables?: string[];
}

export const useRealtimeUpdates = ({ 
  onUpdate, 
  tables = ['medication_adherence_log', 'medication_reminders', 'user_medications']
}: UseRealtimeUpdatesProps = {}) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channels = tables.map(table => {
      const channel = supabase
        .channel(`${table}-changes`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log(`[Realtime] ${table} changed:`, payload);
            
            // Call update callback
            if (onUpdate) {
              onUpdate();
            }

            // Show subtle notification for certain events
            if (payload.eventType === 'INSERT') {
              if (table === 'medication_adherence_log' && payload.new.status === 'taken') {
                toast.success('Dose marked as taken', {
                  description: 'Your medication log has been updated',
                  duration: 2000
                });
              }
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`[Realtime] Subscribed to ${table} changes`);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`[Realtime] Error subscribing to ${table}`);
          }
        });

      return channel;
    });

    // Cleanup function
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [user, onUpdate, tables.join(',')]);
};
