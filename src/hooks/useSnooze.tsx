import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { nativeNotificationManager } from '@/services/nativeNotificationManager';
import { toast } from 'sonner';

interface SnoozeOptions {
  minutes: number;
  maxSnoozes?: number;
}

interface SnoozeState {
  medicationId: string;
  reminderTime: string;
  snoozeCount: number;
  snoozedUntil?: Date;
}

export const useSnooze = () => {
  const [snoozeStates, setSnoozeStates] = useState<Map<string, SnoozeState>>(new Map());
  const [isSnoozing, setIsSnoozing] = useState(false);

  const getSnoozeKey = (medicationId: string, reminderTime: string) => {
    return `${medicationId}-${reminderTime}`;
  };

  const getSnoozeState = useCallback((medicationId: string, reminderTime: string) => {
    const key = getSnoozeKey(medicationId, reminderTime);
    return snoozeStates.get(key);
  }, [snoozeStates]);

  const canSnooze = useCallback((medicationId: string, reminderTime: string, maxSnoozes: number = 3) => {
    const state = getSnoozeState(medicationId, reminderTime);
    if (!state) return true;
    return state.snoozeCount < maxSnoozes;
  }, [getSnoozeState]);

  const snoozeReminder = useCallback(async (
    medicationId: string,
    reminderTime: string,
    options: SnoozeOptions = { minutes: 15, maxSnoozes: 3 }
  ) => {
    const key = getSnoozeKey(medicationId, reminderTime);
    const currentState = snoozeStates.get(key);
    
    if (currentState && options.maxSnoozes && currentState.snoozeCount >= options.maxSnoozes) {
      toast.error(`Maximum snooze limit (${options.maxSnoozes}) reached`);
      return false;
    }

    setIsSnoozing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Calculate snooze time
      const snoozedUntil = new Date(Date.now() + options.minutes * 60 * 1000);

      // Update snooze state
      const newState: SnoozeState = {
        medicationId,
        reminderTime,
        snoozeCount: (currentState?.snoozeCount || 0) + 1,
        snoozedUntil
      };

      setSnoozeStates(prev => new Map(prev.set(key, newState)));

      // Get medication details
      const { data: medication } = await supabase
        .from('user_medications')
        .select('medication_name, dosage')
        .eq('id', medicationId)
        .single();

      if (!medication) throw new Error('Medication not found');

      // Schedule snooze notification via native notification manager
      await nativeNotificationManager.scheduleSnoozeNotification(
        medicationId,
        reminderTime,
        medication.medication_name,
        medication.dosage,
        options.minutes
      );

      // Log snooze action
      await supabase.from('medication_adherence_log').insert({
        user_id: user.id,
        medication_id: medicationId,
        scheduled_time: new Date().toISOString(),
        status: 'snoozed',
        notes: `Snoozed for ${options.minutes} minutes (attempt ${newState.snoozeCount})`
      });

      toast.success(`Reminder snoozed for ${options.minutes} minutes`, {
        description: `You'll be reminded again at ${snoozedUntil.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      });

      // Dispatch event for UI updates
      window.dispatchEvent(new CustomEvent('reminder-snoozed', {
        detail: { medicationId, reminderTime, snoozedUntil, snoozeCount: newState.snoozeCount }
      }));

      return true;
    } catch (error) {
      console.error('[SNOOZE] Error snoozing reminder:', error);
      toast.error('Failed to snooze reminder');
      return false;
    } finally {
      setIsSnoozing(false);
    }
  }, [snoozeStates]);

  const clearSnooze = useCallback((medicationId: string, reminderTime: string) => {
    const key = getSnoozeKey(medicationId, reminderTime);
    setSnoozeStates(prev => {
      const newMap = new Map(prev);
      newMap.delete(key);
      return newMap;
    });
  }, []);

  const resetAllSnoozes = useCallback(() => {
    setSnoozeStates(new Map());
  }, []);

  return {
    snoozeReminder,
    getSnoozeState,
    canSnooze,
    clearSnooze,
    resetAllSnoozes,
    isSnoozing
  };
};
