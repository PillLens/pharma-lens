import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ReminderRow = Database['public']['Tables']['medication_reminders']['Row'];
type AdherenceRow = Database['public']['Tables']['medication_adherence_log']['Row'];

interface BatchMedicationData {
  remindersMap: Map<string, ReminderRow[]>;
  adherenceMap: Map<string, AdherenceRow[]>;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook to batch-fetch medication reminders and adherence data
 * Optimizes performance by using single queries with .in() filters
 * instead of N+1 individual queries per medication
 */
export const useBatchMedicationData = (
  medicationIds: string[],
  userId: string | undefined
): BatchMedicationData => {
  const [remindersMap, setRemindersMap] = useState<Map<string, ReminderRow[]>>(new Map());
  const [adherenceMap, setAdherenceMap] = useState<Map<string, AdherenceRow[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBatchData = async () => {
      if (!userId || medicationIds.length === 0) {
        setRemindersMap(new Map());
        setAdherenceMap(new Map());
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch all reminders for all medications in one query
        const { data: reminders, error: remindersError } = await supabase
          .from('medication_reminders')
          .select('*')
          .eq('user_id', userId)
          .in('medication_id', medicationIds)
          .eq('is_active', true);

        if (remindersError) throw remindersError;

        // Group reminders by medication_id
        const remindersGrouped = new Map<string, ReminderRow[]>();
        reminders?.forEach(reminder => {
          const existing = remindersGrouped.get(reminder.medication_id) || [];
          remindersGrouped.set(reminder.medication_id, [...existing, reminder]);
        });

        // Fetch today's adherence data for all medications in one query
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        const { data: adherence, error: adherenceError } = await supabase
          .from('medication_adherence_log')
          .select('*')
          .eq('user_id', userId)
          .in('medication_id', medicationIds)
          .gte('scheduled_time', startOfDay.toISOString())
          .lte('scheduled_time', endOfDay.toISOString());

        if (adherenceError) throw adherenceError;

        // Group adherence logs by medication_id
        const adherenceGrouped = new Map<string, AdherenceRow[]>();
        adherence?.forEach(log => {
          const existing = adherenceGrouped.get(log.medication_id) || [];
          adherenceGrouped.set(log.medication_id, [...existing, log]);
        });

        setRemindersMap(remindersGrouped);
        setAdherenceMap(adherenceGrouped);
      } catch (err) {
        console.error('Error fetching batch medication data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load medication data');
      } finally {
        setLoading(false);
      }
    };

    fetchBatchData();
  }, [medicationIds, userId]);

  return { remindersMap, adherenceMap, loading, error };
};
