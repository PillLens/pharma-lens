import { supabase } from '@/integrations/supabase/client';
import { toZonedTime, format } from 'date-fns-tz';

export interface MissedDoseInfo {
  medicationId: string;
  medicationName: string;
  scheduledTime: string;
  reminderTime: string;
  status: 'scheduled' | 'taken' | 'missed' | 'overdue';
  overdueMinutes?: number;
}

export class MissedDoseTrackingService {
  private checkInterval: NodeJS.Timeout | null = null;

  /**
   * Start monitoring for missed doses
   */
  startMissedDoseMonitoring(userId: string, timezone: string = 'UTC'): void {
    // Clear any existing interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Check every 5 minutes for missed doses
    this.checkInterval = setInterval(async () => {
      await this.checkAndMarkMissedDoses(userId, timezone);
    }, 5 * 60 * 1000); // 5 minutes

    // Run initial check
    this.checkAndMarkMissedDoses(userId, timezone);
  }

  /**
   * Stop monitoring for missed doses
   */
  stopMissedDoseMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check for overdue doses and mark them as missed
   */
  async checkAndMarkMissedDoses(userId: string, timezone: string = 'UTC'): Promise<void> {
    try {
      const now = toZonedTime(new Date(), timezone);
      const currentTime = format(now, 'HH:mm');
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      // Get active reminders for today
      const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
      
      const { data: activeReminders } = await supabase
        .from('medication_reminders')
        .select(`
          *,
          user_medications (
            id,
            medication_name,
            dosage
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (!activeReminders) return;

      // Filter today's reminders
      const todaysReminders = activeReminders.filter(r => 
        r.days_of_week.includes(currentDayOfWeek)
      );

      console.log(`[MissedDose] Checking ${todaysReminders.length} reminders for user ${userId}`);

      // Check each reminder to see if it should be marked as missed
      for (const reminder of todaysReminders) {
        const reminderTime = reminder.reminder_time;
        const overdueMinutes = this.calculateOverdueMinutes(currentTime, reminderTime);
        
        // Mark as missed if overdue by more than 15 minutes
        if (overdueMinutes > 15) {
          await this.markDoseAsMissed(
            userId,
            reminder.medication_id,
            reminderTime,
            timezone,
            reminder.user_medications?.medication_name || 'Unknown'
          );
        }
      }

      // Trigger UI refresh
      window.dispatchEvent(new CustomEvent('missedDoseUpdate', {
        detail: { userId }
      }));

    } catch (error) {
      console.error('[MissedDose] Error checking for missed doses:', error);
    }
  }

  /**
   * Calculate how many minutes a dose is overdue
   */
  private calculateOverdueMinutes(currentTime: string, reminderTime: string): number {
    const [currentHour, currentMinute] = currentTime.split(':').map(Number);
    const [reminderHour, reminderMinute] = reminderTime.split(':').map(Number);
    
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    const reminderTotalMinutes = reminderHour * 60 + reminderMinute;
    
    return Math.max(0, currentTotalMinutes - reminderTotalMinutes);
  }

  /**
   * Mark a specific dose as missed if not already taken
   */
  private async markDoseAsMissed(
    userId: string,
    medicationId: string,
    reminderTime: string,
    timezone: string,
    medicationName: string
  ): Promise<void> {
    try {
      const today = toZonedTime(new Date(), timezone);
      const [hours, minutes] = reminderTime.split(':').map(Number);
      const scheduledTime = new Date(today);
      scheduledTime.setHours(hours, minutes, 0, 0);

      // Check if this dose already exists in the log
      const { data: existingDose } = await supabase
        .from('medication_adherence_log')
        .select('id, status')
        .eq('user_id', userId)
        .eq('medication_id', medicationId)
        .eq('scheduled_time', scheduledTime.toISOString())
        .maybeSingle();

      // Only mark as missed if it doesn't exist or is still scheduled
      if (!existingDose) {
        // Create new missed entry
        const { error } = await supabase
          .from('medication_adherence_log')
          .insert({
            user_id: userId,
            medication_id: medicationId,
            scheduled_time: scheduledTime.toISOString(),
            status: 'missed',
            notes: `Automatically marked as missed - overdue by more than 15 minutes`
          });

        if (!error) {
          console.log(`[MissedDose] Marked ${medicationName} at ${reminderTime} as missed`);
          
          // Send notification about missed dose
          await this.notifyMissedDose(userId, medicationName, reminderTime);
        }
      } else if (existingDose.status === 'scheduled') {
        // Update scheduled to missed
        const { error } = await supabase
          .from('medication_adherence_log')
          .update({
            status: 'missed',
            notes: `Automatically marked as missed - overdue by more than 15 minutes`
          })
          .eq('id', existingDose.id);

        if (!error) {
          console.log(`[MissedDose] Updated ${medicationName} at ${reminderTime} from scheduled to missed`);
          
          // Send notification about missed dose
          await this.notifyMissedDose(userId, medicationName, reminderTime);
        }
      }
    } catch (error) {
      console.error('[MissedDose] Error marking dose as missed:', error);
    }
  }

  /**
   * Send notification about missed dose
   */
  private async notifyMissedDose(
    userId: string,
    medicationName: string,
    reminderTime: string
  ): Promise<void> {
    try {
      await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: userId,
          title: '⚠️ Missed Medication',
          body: `You missed ${medicationName} at ${reminderTime}. Consider taking it now or contact your healthcare provider.`,
          data: {
            type: 'missed_medication',
            medication_name: medicationName,
            reminder_time: reminderTime
          }
        }
      });
    } catch (error) {
      console.error('[MissedDose] Error sending missed dose notification:', error);
    }
  }

  /**
   * Get current missed doses for today
   */
  async getTodaysMissedDoses(userId: string, timezone: string = 'UTC'): Promise<MissedDoseInfo[]> {
    try {
      const now = toZonedTime(new Date(), timezone);
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: missedDoses } = await supabase
        .from('medication_adherence_log')
        .select(`
          *,
          user_medications (
            medication_name
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'missed')
        .gte('scheduled_time', today.toISOString())
        .lte('scheduled_time', endOfDay.toISOString())
        .order('scheduled_time');

      if (!missedDoses) return [];

      return missedDoses.map(dose => {
        const scheduledTime = new Date(dose.scheduled_time);
        const reminderTime = `${scheduledTime.getHours().toString().padStart(2, '0')}:${scheduledTime.getMinutes().toString().padStart(2, '0')}`;
        
        return {
          medicationId: dose.medication_id,
          medicationName: dose.user_medications?.medication_name || 'Unknown',
          scheduledTime: dose.scheduled_time,
          reminderTime,
          status: 'missed',
        };
      });
    } catch (error) {
      console.error('[MissedDose] Error getting missed doses:', error);
      return [];
    }
  }

  /**
   * Get overdue doses that haven't been marked as missed yet
   */
  async getOverdueDoses(userId: string, timezone: string = 'UTC'): Promise<MissedDoseInfo[]> {
    try {
      const now = toZonedTime(new Date(), timezone);
      const currentTime = format(now, 'HH:mm');
      const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
      
      // Get active reminders for today
      const { data: activeReminders } = await supabase
        .from('medication_reminders')
        .select(`
          *,
          user_medications (
            id,
            medication_name,
            dosage
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (!activeReminders) return [];

      const todaysReminders = activeReminders.filter(r => 
        r.days_of_week.includes(currentDayOfWeek)
      );

      const overdueDoses: MissedDoseInfo[] = [];

      // Check each reminder for overdue status
      for (const reminder of todaysReminders) {
        const overdueMinutes = this.calculateOverdueMinutes(currentTime, reminder.reminder_time);
        
        if (overdueMinutes > 0 && overdueMinutes <= 15) {
          // Check if it's already been taken or missed
          const today = new Date(now);
          const [hours, minutes] = reminder.reminder_time.split(':').map(Number);
          const scheduledTime = new Date(today);
          scheduledTime.setHours(hours, minutes, 0, 0);

          const { data: existingDose } = await supabase
            .from('medication_adherence_log')
            .select('status')
            .eq('user_id', userId)
            .eq('medication_id', reminder.medication_id)
            .eq('scheduled_time', scheduledTime.toISOString())
            .maybeSingle();

          // Only include if not taken or missed
          if (!existingDose || existingDose.status === 'scheduled') {
            overdueDoses.push({
              medicationId: reminder.medication_id,
              medicationName: reminder.user_medications?.medication_name || 'Unknown',
              scheduledTime: scheduledTime.toISOString(),
              reminderTime: reminder.reminder_time,
              status: 'overdue',
              overdueMinutes
            });
          }
        }
      }

      return overdueDoses;
    } catch (error) {
      console.error('[MissedDose] Error getting overdue doses:', error);
      return [];
    }
  }
}

export const missedDoseTrackingService = new MissedDoseTrackingService();