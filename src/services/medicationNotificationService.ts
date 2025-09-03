import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface NotificationSettings {
  sound: boolean;
  vibration: boolean;
  led: boolean;
  snoozeEnabled: boolean;
  snoozeIntervalMinutes: number;
  maxSnoozes: number;
}

export class MedicationNotificationService {
  private notificationTimeouts = new Map<string, NodeJS.Timeout>();
  private snoozeCount = new Map<string, number>();

  /**
   * Schedule notification with grace period and automatic missed marking
   */
  async scheduleNotificationWithGracePeriod(
    userId: string,
    medicationId: string,
    reminderTime: string,
    medicationName: string,
    dosage: string,
    settings: NotificationSettings = {
      sound: true,
      vibration: true,
      led: true,
      snoozeEnabled: true,
      snoozeIntervalMinutes: 15,
      maxSnoozes: 3
    }
  ): Promise<void> {
    const notificationKey = `${medicationId}-${reminderTime}`;
    
    // Clear any existing notification for this medication/time
    this.clearNotification(notificationKey);

    try {
      // Send initial notification
      await this.sendPushNotification(userId, medicationName, dosage, medicationId, reminderTime);
      
      // Set up grace period timeout (15 minutes)
      const gracePeriodMs = 15 * 60 * 1000; // 15 minutes
      
      const timeout = setTimeout(async () => {
        try {
          // Check if dose was taken during grace period
          const wasTaken = await this.checkIfDoseTaken(userId, medicationId, reminderTime);
          
          if (!wasTaken) {
            // Mark as missed and send final notification
            await this.markDoseAsMissedAndNotify(userId, medicationId, reminderTime, medicationName);
          }
          
          this.clearNotification(notificationKey);
        } catch (error) {
          console.error('Error in grace period timeout:', error);
        }
      }, gracePeriodMs);

      this.notificationTimeouts.set(notificationKey, timeout);
      
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  /**
   * Send immediate push notification
   */
  private async sendPushNotification(
    userId: string,
    medicationName: string,
    dosage: string,
    medicationId: string,
    reminderTime: string
  ): Promise<void> {
    try {
      await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: userId,
          title: '💊 Medication Reminder',
          body: `Time to take ${medicationName} (${dosage})`,
          data: {
            type: 'medication_reminder',
            medication_id: medicationId,
            reminder_time: reminderTime,
            action_required: true
          }
        }
      });

      // Also show in-app toast if user is active
      if (document.visibilityState === 'visible') {
        toast('💊 Medication Reminder', {
          description: `Time to take ${medicationName} (${dosage})`,
          action: {
            label: 'Take Now',
            onClick: () => {
              // Trigger take now action
              window.dispatchEvent(new CustomEvent('medication-take-now', {
                detail: { medicationId, reminderTime }
              }));
            }
          },
          duration: 30000, // Keep visible for 30 seconds
        });
      }

    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  /**
   * Check if dose was taken during grace period
   */
  private async checkIfDoseTaken(
    userId: string,
    medicationId: string,
    reminderTime: string
  ): Promise<boolean> {
    try {
      const today = new Date();
      const [hours, minutes] = reminderTime.split(':').map(Number);
      const scheduledTime = new Date(today);
      scheduledTime.setHours(hours, minutes, 0, 0);

      // Check for taken doses in the last 30 minutes around scheduled time
      const windowStart = new Date(scheduledTime.getTime() - 30 * 60 * 1000);
      const windowEnd = new Date(scheduledTime.getTime() + 30 * 60 * 1000);

      const { data } = await supabase
        .from('medication_adherence_log')
        .select('id')
        .eq('user_id', userId)
        .eq('medication_id', medicationId)
        .eq('status', 'taken')
        .gte('scheduled_time', windowStart.toISOString())
        .lte('scheduled_time', windowEnd.toISOString())
        .limit(1);

      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking if dose taken:', error);
      return false;
    }
  }

  /**
   * Mark dose as missed and send notification to caregivers
   */
  private async markDoseAsMissedAndNotify(
    userId: string,
    medicationId: string,
    reminderTime: string,
    medicationName: string
  ): Promise<void> {
    try {
      const today = new Date();
      const [hours, minutes] = reminderTime.split(':').map(Number);
      const scheduledTime = new Date(today);
      scheduledTime.setHours(hours, minutes, 0, 0);

      // Check if already marked
      const { data: existing } = await supabase
        .from('medication_adherence_log')
        .select('id, status')
        .eq('user_id', userId)
        .eq('medication_id', medicationId)
        .eq('scheduled_time', scheduledTime.toISOString())
        .single();

      if (!existing) {
        // Create missed entry
        await supabase
          .from('medication_adherence_log')
          .insert({
            user_id: userId,
            medication_id: medicationId,
            scheduled_time: scheduledTime.toISOString(),
            status: 'missed',
            notes: 'Automatically marked as missed - no response during grace period'
          });
      } else if (existing.status === 'scheduled') {
        // Update from scheduled to missed
        await supabase
          .from('medication_adherence_log')
          .update({
            status: 'missed',
            notes: 'Automatically marked as missed - no response during grace period'
          })
          .eq('id', existing.id);
      }

      // Notify caregivers
      await this.notifyCaregiversOfMissedDose(userId, medicationId, medicationName, reminderTime);

      // Send user notification about missed dose
      await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: userId,
          title: '⚠️ Missed Medication',
          body: `You missed ${medicationName} at ${reminderTime}. Consider taking it now or contact your healthcare provider.`,
          data: {
            type: 'missed_medication',
            medication_id: medicationId,
            reminder_time: reminderTime
          }
        }
      });

    } catch (error) {
      console.error('Error marking dose as missed:', error);
    }
  }

  /**
   * Notify family caregivers of missed dose
   */
  private async notifyCaregiversOfMissedDose(
    userId: string,
    medicationId: string,
    medicationName: string,
    reminderTime: string
  ): Promise<void> {
    try {
      // Get user's family groups
      const { data: userGroups } = await supabase
        .from('family_members')
        .select('family_group_id')
        .eq('user_id', userId)
        .eq('invitation_status', 'accepted');

      if (!userGroups || userGroups.length === 0) return;

      // Get user's profile for name
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', userId)
        .single();

      const userName = userProfile?.display_name || 'Family member';

      for (const group of userGroups) {
        // Get caregivers in this group
        const { data: caregivers } = await supabase
          .from('family_members')
          .select('user_id')
          .eq('family_group_id', group.family_group_id)
          .eq('role', 'caregiver')
          .eq('invitation_status', 'accepted')
          .neq('user_id', userId); // Don't notify the user themselves

        if (caregivers) {
          for (const caregiver of caregivers) {
            await supabase.functions.invoke('send-push-notification', {
              body: {
                user_id: caregiver.user_id,
                title: '⚠️ Family Medication Alert',
                body: `${userName} missed ${medicationName} at ${reminderTime}`,
                data: {
                  type: 'family_missed_medication',
                  medication_id: medicationId,
                  patient_user_id: userId,
                  reminder_time: reminderTime
                }
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error notifying caregivers:', error);
    }
  }

  /**
   * Snooze notification for specified interval
   */
  async snoozeNotification(
    medicationId: string,
    reminderTime: string,
    snoozeMinutes: number = 15
  ): Promise<void> {
    const notificationKey = `${medicationId}-${reminderTime}`;
    const currentSnoozes = this.snoozeCount.get(notificationKey) || 0;

    if (currentSnoozes >= 3) {
      // Max snoozes reached, mark as missed
      toast.error('Maximum snoozes reached. Please take your medication or contact your healthcare provider.');
      return;
    }

    // Clear existing timeout
    this.clearNotification(notificationKey);
    
    // Increment snooze count
    this.snoozeCount.set(notificationKey, currentSnoozes + 1);

    // Set new timeout for snooze
    const snoozeMs = snoozeMinutes * 60 * 1000;
    const timeout = setTimeout(async () => {
      try {
        // Re-send notification after snooze
        const { data: medication } = await supabase
          .from('user_medications')
          .select('medication_name, dosage, user_id')
          .eq('id', medicationId)
          .single();

        if (medication) {
          await this.sendPushNotification(
            medication.user_id,
            medication.medication_name,
            medication.dosage,
            medicationId,
            reminderTime
          );
        }
      } catch (error) {
        console.error('Error in snooze timeout:', error);
      }
    }, snoozeMs);

    this.notificationTimeouts.set(notificationKey, timeout);
    
    toast.success(`Reminder snoozed for ${snoozeMinutes} minutes`);
  }

  /**
   * Clear notification timeout
   */
  clearNotification(notificationKey: string): void {
    const timeout = this.notificationTimeouts.get(notificationKey);
    if (timeout) {
      clearTimeout(timeout);
      this.notificationTimeouts.delete(notificationKey);
    }
    // Reset snooze count
    this.snoozeCount.delete(notificationKey);
  }

  /**
   * Mark dose as taken and clear notifications
   */
  async markDoseTaken(medicationId: string, reminderTime: string): Promise<void> {
    const notificationKey = `${medicationId}-${reminderTime}`;
    this.clearNotification(notificationKey);
    
    // Trigger refresh event for UI components
    window.dispatchEvent(new CustomEvent('medication-dose-taken', {
      detail: { medicationId, reminderTime }
    }));
  }
}

export const medicationNotificationService = new MedicationNotificationService();