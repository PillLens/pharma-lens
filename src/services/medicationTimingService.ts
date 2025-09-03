import { supabase } from '@/integrations/supabase/client';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { format, isAfter, isBefore, addDays, startOfDay } from 'date-fns';

export interface MedicationTimingInfo {
  isDue: boolean;
  nextTime: string;
  isOverdue: boolean;
  currentReminderTime?: string;
  upcomingReminderTimes?: string[];
}

export class MedicationTimingService {
  /**
   * Get next dose time based on actual user reminders and adherence status
   */
  async getNextDoseTime(
    medicationId: string,
    userId: string,
    timezone: string,
    forceRefresh: boolean = false
  ): Promise<MedicationTimingInfo> {
    try {
      // Get active reminders for this medication
      const { data: reminders } = await supabase
        .from('medication_reminders')
        .select('reminder_time, days_of_week')
        .eq('medication_id', medicationId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('reminder_time', { ascending: true });

      if (!reminders || reminders.length === 0) {
        return { isDue: false, nextTime: 'No reminders set', isOverdue: false };
      }

      const now = toZonedTime(new Date(), timezone);
      const currentTime = format(now, 'HH:mm');
      const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // Convert Sunday (0) to 7

      // Get today's adherence data to check what's been taken
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: todaysAdherence } = await supabase
        .from('medication_adherence_log')
        .select('scheduled_time, status, taken_time')
        .eq('user_id', userId)
        .eq('medication_id', medicationId)
        .gte('scheduled_time', startOfDay.toISOString())
        .lte('scheduled_time', endOfDay.toISOString())
        .eq('status', 'taken');

      // Find today's reminders
      const todaysReminders = reminders.filter(r => 
        r.days_of_week.includes(currentDayOfWeek)
      ).sort((a, b) => a.reminder_time.localeCompare(b.reminder_time));

      // Check if there's a current due/overdue reminder that hasn't been taken
      for (const reminder of todaysReminders) {
        const reminderTime = reminder.reminder_time;
        const windowInfo = this.isInDoseWindow(currentTime, reminderTime, 15); // Reduced to 15-minute window
        
        // Check if this specific reminder time has been taken today
        const reminderTaken = todaysAdherence?.some(log => {
          const logTime = new Date(log.scheduled_time);
          const logTimeStr = `${logTime.getHours().toString().padStart(2, '0')}:${logTime.getMinutes().toString().padStart(2, '0')}`;
          return logTimeStr === reminderTime;
        }) || false;

        if ((windowInfo.isDue || windowInfo.isOverdue) && !reminderTaken) {
          const formattedTime = formatInTimeZone(
            this.parseTimeToday(reminderTime, timezone), 
            timezone, 
            'HH:mm'
          );
          
          // Check if it's been overdue for more than 15 minutes - should be marked as missed
          if (windowInfo.isOverdue) {
            const [currentHour, currentMinute] = currentTime.split(':').map(Number);
            const [reminderHour, reminderMinute] = reminderTime.split(':').map(Number);
            const currentTotalMinutes = currentHour * 60 + currentMinute;
            const reminderTotalMinutes = reminderHour * 60 + reminderMinute;
            const overdueBy = currentTotalMinutes - reminderTotalMinutes;
            
            if (overdueBy > 15) {
              // Mark as missed if overdue by more than 15 minutes
              await this.markDoseAsMissed(userId, medicationId, reminderTime, timezone);
              continue; // Skip to next reminder
            }
          }
          
          return {
            isDue: windowInfo.isDue,
            nextTime: windowInfo.isDue ? `Due at ${formattedTime}` : `Overdue: ${formattedTime}`,
            isOverdue: windowInfo.isOverdue,
            currentReminderTime: reminderTime,
            upcomingReminderTimes: todaysReminders.map(r => r.reminder_time)
          };
        }
      }

      // Find next upcoming reminder (all current reminders taken or missed)
      const nextReminder = this.findNextReminder(todaysReminders, currentTime, reminders, currentDayOfWeek);
      return {
        isDue: false,
        nextTime: nextReminder,
        isOverdue: false,
        upcomingReminderTimes: todaysReminders.map(r => r.reminder_time)
      };

    } catch (error) {
      console.error('Error getting next dose time:', error);
      return { isDue: false, nextTime: 'Error calculating next dose', isOverdue: false };
    }
  }

  /**
   * Mark a dose as missed after grace period
   */
  private async markDoseAsMissed(userId: string, medicationId: string, reminderTime: string, timezone: string): Promise<void> {
    try {
      // Create scheduled time for today
      const today = toZonedTime(new Date(), timezone);
      const [hours, minutes] = reminderTime.split(':').map(Number);
      const scheduledTime = new Date(today);
      scheduledTime.setHours(hours, minutes, 0, 0);

      // Check if this dose is already logged
      const { data: existingDose } = await supabase
        .from('medication_adherence_log')
        .select('id, status')
        .eq('user_id', userId)
        .eq('medication_id', medicationId)
        .eq('scheduled_time', scheduledTime.toISOString())
        .single();

      // Only mark as missed if it's not already taken or missed
      if (!existingDose) {
        await supabase
          .from('medication_adherence_log')
          .insert({
            user_id: userId,
            medication_id: medicationId,
            scheduled_time: scheduledTime.toISOString(),
            status: 'missed',
            notes: 'Automatically marked as missed after grace period'
          });
        console.log(`Marked dose as missed: ${reminderTime} for medication ${medicationId}`);
      } else if (existingDose.status === 'scheduled') {
        // Update from scheduled to missed
        await supabase
          .from('medication_adherence_log')
          .update({
            status: 'missed',
            notes: 'Automatically marked as missed after grace period'
          })
          .eq('id', existingDose.id);
        console.log(`Updated scheduled dose to missed: ${reminderTime} for medication ${medicationId}`);
      }
    } catch (error) {
      console.error('Error marking dose as missed:', error);
    }
  }

  /**
   * Check if current time is within dose window - improved logic
   */
  private isInDoseWindow(
    currentTime: string,
    reminderTime: string,
    graceMinutes: number = 15
  ): { isDue: boolean; isOverdue: boolean } {
    const [currentHour, currentMinute] = currentTime.split(':').map(Number);
    const [reminderHour, reminderMinute] = reminderTime.split(':').map(Number);
    
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    const reminderTotalMinutes = reminderHour * 60 + reminderMinute;
    
    // Due window: 15 minutes before to scheduled time
    const dueWindowStart = reminderTotalMinutes - graceMinutes;
    const dueWindowEnd = reminderTotalMinutes;
    
    // Overdue window: after scheduled time up to grace period
    const overdueWindowStart = reminderTotalMinutes;
    const overdueWindowEnd = reminderTotalMinutes + graceMinutes;
    
    const isDue = currentTotalMinutes >= dueWindowStart && currentTotalMinutes <= dueWindowEnd;
    const isOverdue = currentTotalMinutes > overdueWindowStart && currentTotalMinutes <= overdueWindowEnd;
    
    return { isDue, isOverdue };
  }

  /**
   * Find the next reminder time
   */
  private findNextReminder(
    todaysReminders: any[],
    currentTime: string,
    allReminders: any[],
    currentDayOfWeek: number
  ): string {
    const [currentHour, currentMinute] = currentTime.split(':').map(Number);
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    // Check if there's a reminder later today
    for (const reminder of todaysReminders) {
      const [reminderHour, reminderMinute] = reminder.reminder_time.split(':').map(Number);
      const reminderTotalMinutes = reminderHour * 60 + reminderMinute;
      
      if (reminderTotalMinutes > currentTotalMinutes + 15) { // 15 min buffer
        const formattedTime = this.formatTime(reminder.reminder_time);
        return `Next: Today ${formattedTime}`;
      }
    }

    // Find next day with reminders
    for (let daysAhead = 1; daysAhead <= 7; daysAhead++) {
      const checkDay = ((currentDayOfWeek - 1 + daysAhead) % 7) + 1;
      const dayReminders = allReminders.filter(r => 
        r.days_of_week.includes(checkDay)
      ).sort((a, b) => a.reminder_time.localeCompare(b.reminder_time));

      if (dayReminders.length > 0) {
        const nextTime = this.formatTime(dayReminders[0].reminder_time);
        const dayLabel = daysAhead === 1 ? 'Tomorrow' : this.getDayLabel(daysAhead);
        return `Next: ${dayLabel} ${nextTime}`;
      }
    }

    return 'No upcoming reminders';
  }

  /**
   * Parse time string to today's date in timezone
   */
  private parseTimeToday(timeString: string, timezone: string): Date {
    const today = toZonedTime(new Date(), timezone);
    const [hours, minutes] = timeString.split(':').map(Number);
    const result = new Date(today);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  /**
   * Format time for display in 24-hour format
   */
  private formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Get day label for days ahead
   */
  private getDayLabel(daysAhead: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const targetDay = new Date(today);
    targetDay.setDate(today.getDate() + daysAhead);
    return days[targetDay.getDay()];
  }

  /**
   * Check if medication was taken in current reminder window
   */
  async checkRecentDose(
    medicationId: string,
    userId: string,
    timezone: string
  ): Promise<{ recentlyTaken: boolean; takenTime?: string }> {
    try {
      // Get active reminders for this medication
      const { data: reminders } = await supabase
        .from('medication_reminders')
        .select('reminder_time, days_of_week')
        .eq('medication_id', medicationId)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (!reminders || reminders.length === 0) {
        return { recentlyTaken: false };
      }

      const now = toZonedTime(new Date(), timezone);
      const currentTime = format(now, 'HH:mm');
      const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();

      // Get today's start and end
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      // Check doses taken today - look at scheduled_time instead of taken_time for better matching
      const { data: doses } = await supabase
        .from('medication_adherence_log')
        .select('taken_time, scheduled_time')
        .eq('user_id', userId)
        .eq('medication_id', medicationId)
        .eq('status', 'taken')
        .gte('scheduled_time', startOfDay.toISOString())
        .lte('scheduled_time', endOfDay.toISOString())
        .order('scheduled_time', { ascending: false });

      if (!doses || doses.length === 0) {
        return { recentlyTaken: false };
      }

      // Find today's active reminders
      const todaysReminders = reminders.filter(r => 
        r.days_of_week.includes(currentDayOfWeek)
      );

      // Check if any dose was taken for current reminder window
      for (const reminder of todaysReminders) {
        const windowInfo = this.isInDoseWindow(currentTime, reminder.reminder_time, 30);
        
        // If we're in a reminder window, check for taken doses
        if (windowInfo.isDue || windowInfo.isOverdue) {
          const reminderDate = this.parseTimeToday(reminder.reminder_time, timezone);
          
          // Create a wider window for matching (±60 minutes)
          const windowStart = new Date(reminderDate.getTime() - 60 * 60 * 1000);
          const windowEnd = new Date(reminderDate.getTime() + 60 * 60 * 1000);

          for (const dose of doses) {
            const scheduledTime = new Date(dose.scheduled_time);
            // Check if scheduled time matches this reminder window
            if (scheduledTime >= windowStart && scheduledTime <= windowEnd) {
              console.log(`Found matching dose for ${reminder.reminder_time}:`, dose);
              return { 
                recentlyTaken: true, 
                takenTime: dose.taken_time 
              };
            }
          }
        }
      }

      return { recentlyTaken: false };
    } catch (error) {
      console.error('Error checking recent dose:', error);
      return { recentlyTaken: false };
    }
  }
}

export const medicationTimingService = new MedicationTimingService();