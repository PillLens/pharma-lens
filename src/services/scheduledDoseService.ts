import { supabase } from '@/integrations/supabase/client';
import { createScheduledTime } from '@/utils/timezoneUtils';

export class ScheduledDoseService {
  /**
   * Generate scheduled doses for today based on active reminders
   */
  async generateTodaysScheduledDoses(userId: string): Promise<void> {
    try {
      // Get user's timezone
      const { data: profile } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('id', userId)
        .single();

      const timezone = profile?.timezone || 'UTC';
      
      // Get active reminders
      const { data: reminders } = await supabase
        .from('medication_reminders')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (!reminders || reminders.length === 0) return;

      const today = new Date();
      const currentDayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); // Convert Sunday (0) to 7
      
      // Get today's date boundaries in user's timezone
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const scheduledEntries = [];

      for (const reminder of reminders) {
        // Check if this reminder should fire today
        if (reminder.days_of_week.includes(currentDayOfWeek)) {
          const scheduledTime = createScheduledTime(reminder.reminder_time);

          // Check if this scheduled dose already exists
          const { data: existing } = await supabase
            .from('medication_adherence_log')
            .select('id')
            .eq('user_id', userId)
            .eq('medication_id', reminder.medication_id)
            .eq('scheduled_time', scheduledTime.toISOString())
            .maybeSingle();

          if (!existing) {
            scheduledEntries.push({
              user_id: userId,
              medication_id: reminder.medication_id,
              scheduled_time: scheduledTime.toISOString(),
              status: 'scheduled'
            });
          }
        }
      }

      if (scheduledEntries.length > 0) {
        await supabase
          .from('medication_adherence_log')
          .insert(scheduledEntries);
      }
    } catch (error) {
      console.error('Error generating scheduled doses:', error);
    }
  }

  /**
   * Mark a scheduled dose as taken with correct timing - Fixed to prevent duplicates
   */
  async markScheduledDoseAsTaken(
    userId: string,
    medicationId: string,
    reminderTime: string,
    notes?: string
  ): Promise<boolean> {
    try {
      // Find the scheduled dose for today based on the reminder time
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      // Look for the scheduled dose entry for this reminder time today
      const { data: scheduledDoses } = await supabase
        .from('medication_adherence_log')
        .select('id, status, scheduled_time')
        .eq('user_id', userId)
        .eq('medication_id', medicationId)
        .gte('scheduled_time', startOfDay.toISOString())
        .lte('scheduled_time', endOfDay.toISOString())
        .eq('status', 'scheduled');

      // Find the dose that matches this reminder time
      let targetDose = null;
      if (scheduledDoses) {
        for (const dose of scheduledDoses) {
          const doseTime = new Date(dose.scheduled_time);
          const doseTimeStr = `${doseTime.getHours().toString().padStart(2, '0')}:${doseTime.getMinutes().toString().padStart(2, '0')}`;
          if (doseTimeStr === reminderTime) {
            targetDose = dose;
            break;
          }
        }
      }

      if (targetDose) {
        // Update the existing scheduled dose to mark it as taken
        const { error } = await supabase
          .from('medication_adherence_log')
          .update({
            status: 'taken',
            taken_time: new Date().toISOString(), // Record actual time taken
            notes: notes || 'Marked via Take Now button',
            reported_by: userId
          })
          .eq('id', targetDose.id);

        console.log(`[DEBUG] Updated existing scheduled dose ${targetDose.id}, error:`, error);
        return !error;
      }

      // If no scheduled dose found, create a new one (shouldn't normally happen)
      console.log(`[DEBUG] No scheduled dose found for ${reminderTime}, creating new entry`);
      const scheduledTime = createScheduledTime(reminderTime);
      
      const { error } = await supabase
        .from('medication_adherence_log')
        .insert({
          user_id: userId,
          medication_id: medicationId,
          scheduled_time: scheduledTime.toISOString(),
          taken_time: new Date().toISOString(),
          status: 'taken',
          notes: notes || 'Marked via Take Now button'
        });

      console.log(`[DEBUG] Created new entry, error:`, error);
      return !error;
    } catch (error) {
      console.error('Error marking dose as taken:', error);
      return false;
    }
  }

  /**
   * Get today's adherence status for dashboard - Fixed to prevent duplicate counting
   */
  async getTodaysAdherenceStatus(userId: string) {
    try {
      // First ensure today's scheduled doses are generated
      await this.generateTodaysScheduledDoses(userId);

      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: adherenceData } = await supabase
        .from('medication_adherence_log')
        .select('medication_id, scheduled_time, status')
        .eq('user_id', userId)
        .gte('scheduled_time', startOfDay.toISOString())
        .lte('scheduled_time', endOfDay.toISOString())
        .order('medication_id, scheduled_time, status');

      if (!adherenceData) {
        return {
          totalToday: 0,
          completedToday: 0,
          missedToday: 0,
          pendingToday: 0
        };
      }

      // Group by medication_id + scheduled_time to eliminate duplicates
      const uniqueDoses = new Map();
      adherenceData.forEach(entry => {
        const key = `${entry.medication_id}-${entry.scheduled_time}`;
        const existing = uniqueDoses.get(key);
        
        // Prioritize 'taken' status over 'scheduled' status to avoid double counting
        if (!existing || (entry.status === 'taken' && existing.status !== 'taken')) {
          uniqueDoses.set(key, entry);
        }
      });

      const uniqueEntries = Array.from(uniqueDoses.values());
      const scheduled = uniqueEntries.filter(a => a.status === 'scheduled').length;
      const taken = uniqueEntries.filter(a => a.status === 'taken').length;
      const missed = uniqueEntries.filter(a => a.status === 'missed').length;
      const total = scheduled + taken + missed;

      return {
        totalToday: total,
        completedToday: taken,
        missedToday: missed,
        pendingToday: scheduled
      };
    } catch (error) {
      console.error('Error getting adherence status:', error);
      return {
        totalToday: 0,
        completedToday: 0,
        missedToday: 0,
        pendingToday: 0
      };
    }
  }
}

export const scheduledDoseService = new ScheduledDoseService();