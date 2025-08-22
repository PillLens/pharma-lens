import { supabase } from '@/integrations/supabase/client';

export interface PushNotificationData {
  type: 'medication_reminder' | 'drug_interaction' | 'pharmacy_alert' | 'general';
  medicationId?: string;
  reminderTime?: string;
  interactionSeverity?: 'major' | 'moderate' | 'minor';
  pharmacyId?: string;
  [key: string]: any;
}

export interface DeviceToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
  appVersion?: string;
  isActive: boolean;
}

export class PushNotificationService {
  // Register device token for push notifications
  async registerDeviceToken(userId: string, deviceToken: DeviceToken): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('device_tokens')
        .upsert({
          user_id: userId,
          token: deviceToken.token,
          platform: deviceToken.platform,
          app_version: deviceToken.appVersion,
          is_active: deviceToken.isActive
        }, {
          onConflict: 'token'
        });

      if (error) {
        console.error('Error registering device token:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in registerDeviceToken:', error);
      return false;
    }
  }

  // Send push notification
  async sendNotification(
    userId: string,
    title: string,
    body: string,
    data: PushNotificationData = { type: 'general' },
    deviceToken?: string
  ): Promise<boolean> {
    try {
      const { data: result, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId,
          title,
          body,
          data,
          deviceToken
        }
      });

      if (error) {
        console.error('Error sending push notification:', error);
        return false;
      }

      return result?.success || false;
    } catch (error) {
      console.error('Error in sendNotification:', error);
      return false;
    }
  }

  // Send medication reminder notification
  async sendMedicationReminder(
    userId: string,
    medicationName: string,
    dosage: string,
    reminderTime: string
  ): Promise<boolean> {
    const title = 'Medication Reminder';
    const body = `Time to take your ${medicationName} (${dosage})`;
    const data: PushNotificationData = {
      type: 'medication_reminder',
      reminderTime,
      medicationName,
      dosage
    };

    return this.sendNotification(userId, title, body, data);
  }

  // Send drug interaction alert
  async sendDrugInteractionAlert(
    userId: string,
    medication1: string,
    medication2: string,
    severity: 'major' | 'moderate' | 'minor'
  ): Promise<boolean> {
    const severityText = severity === 'major' ? 'CRITICAL' : severity.toUpperCase();
    const title = `${severityText} Drug Interaction Alert`;
    const body = `Potential ${severity} interaction between ${medication1} and ${medication2}`;
    const data: PushNotificationData = {
      type: 'drug_interaction',
      interactionSeverity: severity,
      medications: [medication1, medication2]
    };

    return this.sendNotification(userId, title, body, data);
  }

  // Send pharmacy availability notification
  async sendPharmacyAlert(
    userId: string,
    pharmacyName: string,
    medicationName: string,
    isAvailable: boolean
  ): Promise<boolean> {
    const title = isAvailable ? 'Medication Available' : 'Medication Out of Stock';
    const body = isAvailable 
      ? `${medicationName} is now available at ${pharmacyName}`
      : `${medicationName} is out of stock at ${pharmacyName}`;
    const data: PushNotificationData = {
      type: 'pharmacy_alert',
      pharmacyName,
      medicationName,
      isAvailable
    };

    return this.sendNotification(userId, title, body, data);
  }

  // Get user's notification history
  async getNotificationHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('push_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching notification history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getNotificationHistory:', error);
      return [];
    }
  }

  // Mark notification as read (if needed for UI)
  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('push_notifications')
        .update({ 
          data: { read: true }  // Simplified approach
        })
        .eq('id', notificationId);

      return !error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Schedule medication reminders based on user's medication schedule
  async scheduleMedicationReminders(userId: string): Promise<void> {
    try {
      // Get user's active medications with reminders
      const { data: medications, error: medError } = await supabase
        .from('user_medications')
        .select(`
          *,
          medication_reminders (
            id,
            reminder_time,
            days_of_week,
            is_active,
            notification_settings
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (medError) {
        console.error('Error fetching user medications:', medError);
        return;
      }

      // Process each medication with reminders
      for (const medication of medications || []) {
        if (medication.medication_reminders?.length > 0) {
          for (const reminder of medication.medication_reminders) {
            if (reminder.is_active) {
              // In a real implementation, you would schedule these with a job scheduler
              // For now, we'll just log the scheduling
              console.log(`Scheduling reminder for ${medication.medication_name} at ${reminder.reminder_time}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error scheduling medication reminders:', error);
    }
  }

  // Unregister device token (when user logs out or uninstalls app)
  async unregisterDeviceToken(token: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('device_tokens')
        .update({ is_active: false })
        .eq('token', token);

      return !error;
    } catch (error) {
      console.error('Error unregistering device token:', error);
      return false;
    }
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();