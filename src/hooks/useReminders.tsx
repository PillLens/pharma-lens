import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
        .eq('user_id' as any, user.id as any)
        .order('reminder_time', { ascending: true });

      if (error) throw error;

      const remindersWithMedications = (data as any)?.map((reminder: any) => ({
        ...(reminder as any),
        medication: (reminder as any).user_medications || null,
        enabledFeatures: (reminder as any).notification_settings || { sound: true, vibration: true, led: true }
      })) || [];

      setReminders(remindersWithMedications);
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

    try {
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
        } as any])
        .select()
        .single();

      if (error) throw error;

      await fetchReminders(); // Refresh the list
      return data;
    } catch (error) {
      console.error('Error adding reminder:', error);
      toast.error('Failed to add reminder');
      return null;
    }
  };

  const updateReminder = async (id: string, updates: Partial<MedicationReminder>) => {
    try {
      const { error } = await supabase
        .from('medication_reminders')
        .update(updates as any)
        .eq('id' as any, id as any)
        .eq('user_id' as any, user?.id as any);

      if (error) throw error;

      await fetchReminders(); // Refresh the list
      return true;
    } catch (error) {
      console.error('Error updating reminder:', error);
      toast.error('Failed to update reminder');
      return false;
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('medication_reminders')
        .delete()
        .eq('id' as any, id as any)
        .eq('user_id' as any, user?.id as any);

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

  useEffect(() => {
    fetchReminders();
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
    refetch: fetchReminders
  };
};