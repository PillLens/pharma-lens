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
   * Mark a scheduled dose as taken with correct timing
   */
  async markScheduledDoseAsTaken(
    userId: string,
    medicationId: string,
    reminderTime: string,
    notes?: string
  ): Promise<boolean> {
    try {
      const scheduledTime = createScheduledTime(reminderTime);
      
      console.log(`[DEBUG] Marking dose as taken - reminderTime: ${reminderTime}, scheduledTime: ${scheduledTime.toISOString()}`);

      // ONLY try to find the exact scheduled time entry - no nearby search
      const { data: exactEntry } = await supabase
        .from('medication_adherence_log')
        .select('id, status, scheduled_time')
        .eq('user_id', userId)
        .eq('medication_id', medicationId)
        .eq('scheduled_time', scheduledTime.toISOString())
        .maybeSingle();

      console.log(`[DEBUG] Found exact entry:`, exactEntry);

      if (exactEntry) {
        // Update existing exact entry to taken status
        const { error } = await supabase
          .from('medication_adherence_log')
          .update({
            status: 'taken',
            taken_time: new Date().toISOString(), // Use current time as taken time
            notes: notes || 'Marked via Take Now button',
            reported_by: userId
          })
          .eq('id', exactEntry.id);

        console.log(`[DEBUG] Updated existing entry, error:`, error);
        return !error;
      }

      // No exact entry found, create a new one with upsert
      const { error } = await supabase
        .from('medication_adherence_log')
        .upsert({
          user_id: userId,
          medication_id: medicationId,
          scheduled_time: scheduledTime.toISOString(),
          taken_time: new Date().toISOString(), // Use current time as taken time
          status: 'taken',
          notes: notes || 'Marked via Take Now button'
        }, {
          onConflict: 'user_id,medication_id,scheduled_time'
        });

      console.log(`[DEBUG] Created new entry, error:`, error);
      return !error;
    } catch (error) {
      console.error('Error marking dose as taken:', error);
      
      // If it's a unique constraint error, try to update instead
      if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        try {
          const scheduledTime = createScheduledTime(reminderTime);

          const { error: updateError } = await supabase
            .from('medication_adherence_log')
            .update({
              status: 'taken',
              taken_time: scheduledTime.toISOString(),
              notes: notes || 'Marked via Take Now button',
              reported_by: userId
            })
            .eq('user_id', userId)
            .eq('medication_id', medicationId)
            .eq('scheduled_time', scheduledTime.toISOString());

          return !updateError;
        } catch (retryError) {
          console.error('Retry update failed:', retryError);
          return false;
        }
      }
      
      return false;
    }
  }

  /**
   * Get today's adherence status for dashboard
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
        .select('status, scheduled_time')
        .eq('user_id', userId)
        .gte('scheduled_time', startOfDay.toISOString())
        .lte('scheduled_time', endOfDay.toISOString());

      const scheduled = adherenceData?.filter(a => a.status === 'scheduled').length || 0;
      const taken = adherenceData?.filter(a => a.status === 'taken').length || 0;
      const missed = adherenceData?.filter(a => a.status === 'missed').length || 0;
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