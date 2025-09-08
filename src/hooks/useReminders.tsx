import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { nativeNotificationManager } from '@/services/nativeNotificationManager';
import { capacitorService } from '@/services/capacitorService';

export interface MedicationReminder {
  id: string;
  user_id: string;
  medication_id: string;
  reminder_time: string;
  days_of_week: number[];
  is_active: boolean;
  notification_settings: {
    sound: boolean;
    vibration: boolean;
    led: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface ReminderWithMedication extends MedicationReminder {
  medication?: {
    medication_name: string;
    dosage: string;
    frequency: string;
  };
}

export const useReminders = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<ReminderWithMedication[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('medication_reminders')
        .select(`
          *,
          user_medications!inner(
            medication_name,
            dosage,
            frequency
          )
        `)
        .eq('user_id', user.id)
        .order('reminder_time', { ascending: true });

      if (error) throw error;

      const remindersWithMedication = data.map(reminder => ({
        ...reminder,
        medication: reminder.user_medications,
        notification_settings: typeof reminder.notification_settings === 'object' 
          ? reminder.notification_settings as { sound: boolean; vibration: boolean; led: boolean; }
          : { sound: true, vibration: true, led: true }
      }));

      setReminders(remindersWithMedication);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      toast.error('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  const addReminder = async (reminderData: {
    medication_id: string;
    reminder_time: string;
    days_of_week: number[];
    notification_settings?: any;
  }) => {
    if (!user) return null;

    // Check reminder limits before adding
    const canCreate = await canCreateReminder();
    if (!canCreate.allowed) {
      toast.error(canCreate.reason);
      return null;
    }

    try {
      // Optimistic update - add to local state first
      const optimisticReminder = {
        id: `temp-${Date.now()}`,
        user_id: user.id,
        medication_id: reminderData.medication_id,
        reminder_time: reminderData.reminder_time,
        days_of_week: reminderData.days_of_week,
        notification_settings: reminderData.notification_settings || {
          sound: true,
          vibration: true,
          led: true
        },
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Add optimistic reminder to state immediately
      setReminders(prev => [optimisticReminder, ...prev]);

      const { data, error } = await supabase
        .from('medication_reminders')
        .insert([{
          user_id: user.id,
          medication_id: reminderData.medication_id,
          reminder_time: reminderData.reminder_time,
          days_of_week: reminderData.days_of_week,
          notification_settings: reminderData.notification_settings || {
            sound: true,
            vibration: true,
            led: true
          },
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic update with real data
      const newReminder = {
        ...data,
        medication: undefined,
        notification_settings: typeof data.notification_settings === 'object' 
          ? data.notification_settings as { sound: boolean; vibration: boolean; led: boolean; }
          : { sound: true, vibration: true, led: true }
      } as ReminderWithMedication;

      setReminders(prev => prev.map(r => 
        r.id === optimisticReminder.id ? newReminder : r
      ));

      // Schedule native notifications if on mobile
      if (capacitorService.isNative()) {
        console.log('[USE-REMINDERS] Scheduling native notification for new reminder');
        try {
          // Get medication details for scheduling
          const { data: medication } = await supabase
            .from('user_medications')
            .select('medication_name, dosage')
            .eq('id', reminderData.medication_id)
            .single();

          if (medication) {
            const reminderForScheduling = {
              ...newReminder,
              medication: {
                medication_name: medication.medication_name,
                dosage: medication.dosage
              }
            };

            await nativeNotificationManager.scheduleReminder(reminderForScheduling);
          }
        } catch (scheduleError) {
          console.error('[USE-REMINDERS] Failed to schedule native notification:', scheduleError);
          toast.warning('Reminder saved but notification scheduling failed. Please check your notification permissions.');
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error adding reminder:', error);
      toast.error('Failed to add reminder');
      
      // Remove optimistic update on error
      setReminders(prev => prev.filter(r => !r.id.startsWith('temp-')));
      
      return null;
    }
  };

  const updateReminder = async (id: string, updates: Partial<MedicationReminder>) => {
    try {
      const { error } = await supabase
        .from('medication_reminders')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Cancel existing native notifications for this reminder
      if (capacitorService.isNative()) {
        await nativeNotificationManager.cancelReminder(id);
      }

      // Reschedule if still active
      if (updates.is_active !== false && capacitorService.isNative()) {
        try {
          // Refresh the list to get updated reminder
          await fetchReminders();
          const updatedReminder = reminders.find(r => r.id === id);
          
          if (updatedReminder && updatedReminder.is_active) {
            // Get medication details
            const { data: medication } = await supabase
              .from('user_medications')
              .select('medication_name, dosage')
              .eq('id', updatedReminder.medication_id)
              .single();

            if (medication) {
              const reminderForScheduling = {
                ...updatedReminder,
                medication: {
                  medication_name: medication.medication_name,
                  dosage: medication.dosage
                }
              };

              await nativeNotificationManager.scheduleReminder(reminderForScheduling);
            }
          }
        } catch (scheduleError) {
          console.error('[USE-REMINDERS] Failed to reschedule notification:', scheduleError);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error updating reminder:', error);
      toast.error('Failed to update reminder');
      return false;
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      // Cancel native notifications first
      if (capacitorService.isNative()) {
        await nativeNotificationManager.cancelReminder(id);
      }

      const { error } = await supabase
        .from('medication_reminders')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setReminders(prev => prev.filter(r => r.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast.error('Failed to delete reminder');
      return false;
    }
  };

  const toggleReminderStatus = async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return false;

    return await updateReminder(id, { is_active: !reminder.is_active });
  };

  const getActiveReminders = () => reminders.filter(r => r.is_active);
  
  const getTodaysReminders = () => {
    const today = new Date().getDay();
    const adjustedDay = today === 0 ? 7 : today; // Convert Sunday from 0 to 7
    
    return reminders.filter(r => 
      r.is_active && r.days_of_week.includes(adjustedDay)
    );
  };

  const canCreateReminder = async () => {
    if (!user) {
      return { allowed: false, reason: 'User not authenticated' };
    }

    try {
      // Import entitlementsService dynamically to avoid circular imports
      const { entitlementsService } = await import('@/services/entitlementsService');
      
      const entitlements = await entitlementsService.getUserEntitlements(user.id);
      const subscription = await entitlementsService.getUserSubscription(user.id);
      
      const currentCount = reminders.length;
      const limit = entitlements.reminders_limit;
      
      // If unlimited (-1) or in trial, allow
      const isInTrial = await entitlementsService.isInTrial(user.id);
      if (limit === -1 || isInTrial) {
        return { allowed: true, reason: '' };
      }
      
      // Check if at or over limit
      if (currentCount >= limit) {
        const trialDays = isInTrial ? await entitlementsService.getRemainingTrialDays(user.id) : 0;
        
        if (isInTrial && trialDays > 0) {
          return { allowed: true, reason: '' };
        }
        
        return { 
          allowed: false, 
          reason: `You've reached your limit of ${limit} reminder${limit === 1 ? '' : 's'}. Upgrade to Pro for unlimited reminders.`
        };
      }
      
      return { allowed: true, reason: '' };
    } catch (error) {
      console.error('Error checking reminder limits:', error);
      return { allowed: false, reason: 'Unable to verify reminder limits. Please try again.' };
    }
  };

  const getReminderLimitInfo = async () => {
    if (!user) return null;

    try {
      const { entitlementsService } = await import('@/services/entitlementsService');
      
      const entitlements = await entitlementsService.getUserEntitlements(user.id);
      const subscription = await entitlementsService.getUserSubscription(user.id);
      
      const currentCount = reminders.length;
      const limit = entitlements.reminders_limit;
      const isInTrial = await entitlementsService.isInTrial(user.id);
      const trialDays = isInTrial ? await entitlementsService.getRemainingTrialDays(user.id) : 0;
      
      return {
        current: currentCount,
        limit: limit === -1 ? 'unlimited' : limit,
        isInTrial,
        trialDays,
        canCreate: (limit === -1 || currentCount < limit || isInTrial),
        plan: subscription.plan
      };
    } catch (error) {
      console.error('Error getting reminder limit info:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchReminders();
    
    // Listen for medication data changes from other components
    const handleMedicationDataChange = () => {
      fetchReminders();
    };
    
    window.addEventListener('medicationDataChanged', handleMedicationDataChange);
    
    return () => {
      window.removeEventListener('medicationDataChanged', handleMedicationDataChange);
    };
  }, [user]);

  return {
    reminders,
    loading,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminderStatus,
    getActiveReminders,
    getTodaysReminders,
    canCreateReminder,
    getReminderLimitInfo,
    refetch: fetchReminders
  };
};