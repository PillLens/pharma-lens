import { LocalNotifications } from '@capacitor/local-notifications';
import { capacitorService } from './capacitorService';
import { medicationNotificationService } from './medicationNotificationService';
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
  medication?: {
    medication_name: string;
    dosage: string;
  };
}

class NativeNotificationManager {
  private isInitialized = false;
  private scheduledNotifications = new Map<string, number[]>();

  async initialize(): Promise<boolean> {
    if (this.isInitialized || !capacitorService.isNative()) {
      return this.isInitialized;
    }

    try {
      console.log('[NATIVE-NOTIFICATIONS] Initializing...');
      
      // Request permissions
      const localPermissions = await capacitorService.requestLocalNotificationPermissions();
      const pushPermissions = await capacitorService.requestPushPermissions();
      
      if (!localPermissions) {
        console.warn('[NATIVE-NOTIFICATIONS] Local notification permissions not granted');
        toast.error('Local notification permissions required for medication reminders');
        return false;
      }

      // Initialize listeners
      capacitorService.initializeNotificationListeners();
      this.setupCustomEventListeners();

      this.isInitialized = true;
      console.log('[NATIVE-NOTIFICATIONS] Initialized successfully');
      
      return true;
    } catch (error) {
      console.error('[NATIVE-NOTIFICATIONS] Initialization failed:', error);
      return false;
    }
  }

  private setupCustomEventListeners(): void {
    // Handle push notifications
    window.addEventListener('push-notification-received', (event: any) => {
      const notification = event.detail;
      this.handlePushNotification(notification);
    });

    // Handle push notification actions
    window.addEventListener('push-notification-action', (event: any) => {
      const action = event.detail;
      this.handlePushNotificationAction(action);
    });

    // Handle local notification actions
    window.addEventListener('local-notification-action', (event: any) => {
      const notification = event.detail;
      this.handleLocalNotificationAction(notification);
    });

    // Handle medication taken events
    window.addEventListener('medication-take-now', (event: any) => {
      const { medicationId, reminderTime } = event.detail;
      this.handleMedicationTaken(medicationId, reminderTime);
    });
  }

  private handlePushNotification(notification: any): void {
    console.log('[NATIVE-NOTIFICATIONS] Handling push notification:', notification);
    
    const type = notification.data?.type;
    
    switch (type) {
      case 'medication_reminder':
        this.handleMedicationReminderPush(notification);
        break;
      case 'missed_medication':
        this.handleMissedMedicationPush(notification);
        break;
      case 'family_missed_medication':
        this.handleFamilyMissedMedicationPush(notification);
        break;
      default:
        toast.info(notification.body || notification.title || 'New notification');
    }
  }

  private handlePushNotificationAction(action: any): void {
    console.log('[NATIVE-NOTIFICATIONS] Handling push action:', action);
    
    const actionId = action.actionId;
    const data = action.notification.data;
    
    switch (actionId) {
      case 'take_now':
        if (data?.medication_id && data?.reminder_time) {
          this.handleMedicationTaken(data.medication_id, data.reminder_time);
        }
        break;
      case 'snooze':
        if (data?.medication_id && data?.reminder_time) {
          this.snoozeMedication(data.medication_id, data.reminder_time);
        }
        break;
      case 'view_details':
        if (data?.medication_id) {
          this.navigateToMedication(data.medication_id);
        }
        break;
    }
  }

  private handleLocalNotificationAction(notification: any): void {
    console.log('[NATIVE-NOTIFICATIONS] Handling local notification action:', notification);
    
    const extra = notification.notification.extra;
    
    if (extra?.medicationId && extra?.reminderTime) {
      // For local notifications, default action is to mark as taken
      this.handleMedicationTaken(extra.medicationId, extra.reminderTime);
    }
  }

  private async handleMedicationTaken(medicationId: string, reminderTime: string): Promise<void> {
    try {
      console.log('[NATIVE-NOTIFICATIONS] Marking medication as taken:', { medicationId, reminderTime });
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      const [hours, minutes] = reminderTime.split(':').map(Number);
      const scheduledTime = new Date(today);
      scheduledTime.setHours(hours, minutes, 0, 0);

      // Create adherence log entry
      const { error } = await supabase
        .from('medication_adherence_log')
        .upsert({
          user_id: user.id,
          medication_id: medicationId,
          scheduled_time: scheduledTime.toISOString(),
          actual_time: new Date().toISOString(),
          status: 'taken',
          notes: 'Marked as taken from notification'
        }, {
          onConflict: 'user_id,medication_id,scheduled_time'
        });

      if (error) throw error;

      // Clear any pending notifications for this medication/time
      await medicationNotificationService.markDoseTaken(medicationId, reminderTime);
      
      // Cancel local notifications for this reminder
      await this.cancelLocalNotificationsForReminder(medicationId, reminderTime);
      
      toast.success('Medication marked as taken');
      
      // Dispatch event for UI updates
      window.dispatchEvent(new CustomEvent('medication-adherence-updated', {
        detail: { medicationId, reminderTime, status: 'taken' }
      }));

    } catch (error) {
      console.error('[NATIVE-NOTIFICATIONS] Error marking medication as taken:', error);
      toast.error('Failed to mark medication as taken');
    }
  }

  async scheduleSnoozeNotification(
    medicationId: string, 
    reminderTime: string,
    medicationName: string,
    dosage: string,
    snoozeMinutes: number = 15
  ): Promise<void> {
    if (!capacitorService.isNative()) {
      console.log('[NATIVE-NOTIFICATIONS] Not native - skipping snooze notification');
      return;
    }

    try {
      await medicationNotificationService.snoozeNotification(medicationId, reminderTime, snoozeMinutes);
      
      const snoozeTime = new Date(Date.now() + snoozeMinutes * 60 * 1000);
      
      await LocalNotifications.schedule({
        notifications: [{
          id: parseInt(`${medicationId.slice(-8)}${Date.now().toString().slice(-4)}`),
          title: '💊 Medication Reminder (Snoozed)',
          body: `Time to take ${medicationName}${dosage ? ` (${dosage})` : ''}`,
          schedule: { at: snoozeTime },
          sound: 'default',
          extra: {
            medicationId,
            reminderTime,
            isSnoozed: true
          }
        }]
      });

      console.log(`[NATIVE-NOTIFICATIONS] Scheduled snooze notification for ${snoozeMinutes} minutes`);
    } catch (error) {
      console.error('[NATIVE-NOTIFICATIONS] Error scheduling snooze notification:', error);
      throw error;
    }
  }

  private async snoozeMedication(medicationId: string, reminderTime: string): Promise<void> {
    // Legacy method - calls new public method
    const { data: medication } = await supabase
      .from('user_medications')
      .select('medication_name, dosage')
      .eq('id', medicationId)
      .single();

    if (medication) {
      await this.scheduleSnoozeNotification(
        medicationId,
        reminderTime,
        medication.medication_name,
        medication.dosage,
        15
      );
    }
  }

  private navigateToMedication(medicationId: string): void {
    // Dispatch navigation event
    window.dispatchEvent(new CustomEvent('navigate-to-medication', {
      detail: { medicationId }
    }));
  }

  private handleMedicationReminderPush(notification: any): void {
    toast('💊 ' + (notification.title || 'Medication Reminder'), {
      description: notification.body,
      action: {
        label: 'Take Now',
        onClick: () => {
          const medicationId = notification.data?.medication_id;
          const reminderTime = notification.data?.reminder_time;
          if (medicationId && reminderTime) {
            this.handleMedicationTaken(medicationId, reminderTime);
          }
        }
      },
      duration: 30000,
    });
  }

  private handleMissedMedicationPush(notification: any): void {
    toast.error(notification.title || 'Missed Medication', {
      description: notification.body,
      duration: 10000,
    });
  }

  private handleFamilyMissedMedicationPush(notification: any): void {
    toast.warning(notification.title || 'Family Alert', {
      description: notification.body,
      duration: 15000,
    });
  }

  async scheduleReminder(reminder: MedicationReminder): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!capacitorService.isNative() || !reminder.is_active) {
      return false;
    }

    try {
      console.log('[NATIVE-NOTIFICATIONS] Scheduling reminder:', reminder);
      
      const notifications = this.generateNotificationSchedule(reminder);
      
      if (notifications.length === 0) {
        console.log('[NATIVE-NOTIFICATIONS] No notifications to schedule');
        return true;
      }

      await LocalNotifications.schedule({ notifications });
      
      // Track scheduled notification IDs
      const notificationIds = notifications.map(n => n.id);
      this.scheduledNotifications.set(reminder.id, notificationIds);
      
      console.log(`[NATIVE-NOTIFICATIONS] Scheduled ${notifications.length} notifications for ${reminder.id}`);
      
      // Also set up advanced notification scheduling with grace period
      await this.setupAdvancedNotificationScheduling(reminder);
      
      return true;
    } catch (error) {
      console.error('[NATIVE-NOTIFICATIONS] Failed to schedule reminder:', error);
      return false;
    }
  }

  private async setupAdvancedNotificationScheduling(reminder: MedicationReminder): Promise<void> {
    if (!reminder.medication) return;

    const today = new Date();
    const [hours, minutes] = reminder.reminder_time.split(':').map(Number);
    
    // Schedule for next 7 days
    for (let day = 0; day < 7; day++) {
      const notificationDate = new Date(today);
      notificationDate.setDate(today.getDate() + day);
      
      // Check if this day is in the reminder's schedule
      const dayOfWeek = notificationDate.getDay();
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert Sunday from 0 to 7
      
      if (reminder.days_of_week.includes(adjustedDay)) {
        notificationDate.setHours(hours, minutes, 0, 0);
        
        // Only schedule future notifications
        if (notificationDate > today) {
          // Schedule the advanced notification with grace period
          const timeUntilReminder = notificationDate.getTime() - today.getTime();
          
          setTimeout(async () => {
            try {
              await medicationNotificationService.scheduleNotificationWithGracePeriod(
                reminder.user_id,
                reminder.medication_id,
                reminder.reminder_time,
                reminder.medication?.medication_name || 'Medication',
                reminder.medication?.dosage || '',
                {
                  sound: reminder.notification_settings.sound,
                  vibration: reminder.notification_settings.vibration,
                  led: reminder.notification_settings.led,
                  snoozeEnabled: true,
                  snoozeIntervalMinutes: 15,
                  maxSnoozes: 3
                }
              );
            } catch (error) {
              console.error('[NATIVE-NOTIFICATIONS] Error in advanced scheduling:', error);
            }
          }, timeUntilReminder);
        }
      }
    }
  }

  private generateNotificationSchedule(reminder: MedicationReminder): any[] {
    const notifications = [];
    const now = new Date();
    
    // Generate notifications for the next 7 days
    for (let day = 0; day < 7; day++) {
      const notificationDate = new Date(now);
      notificationDate.setDate(now.getDate() + day);
      
      // Check if notification should be sent on this day
      const dayOfWeek = notificationDate.getDay();
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert Sunday from 0 to 7
      
      if (reminder.days_of_week.includes(adjustedDay)) {
        const [hours, minutes] = reminder.reminder_time.split(':').map(Number);
        notificationDate.setHours(hours, minutes, 0, 0);
        
        // Only schedule future notifications
        if (notificationDate > now) {
          const medicationName = reminder.medication?.medication_name || 'Your medication';
          const dosage = reminder.medication?.dosage || '';
          
          notifications.push({
            id: parseInt(`${reminder.id.slice(-8)}${day}`), // Use last 8 chars of reminder ID + day
            title: '💊 Medication Reminder',
            body: `Time to take ${medicationName}${dosage ? ` (${dosage})` : ''}`,
            schedule: { at: notificationDate },
            sound: reminder.notification_settings.sound ? 'default' : undefined,
            extra: {
              medicationId: reminder.medication_id,
              reminderId: reminder.id,
              reminderTime: reminder.reminder_time,
              medicationName,
              dosage
            }
          });
        }
      }
    }
    
    return notifications;
  }

  async cancelReminder(reminderId: string): Promise<boolean> {
    try {
      const notificationIds = this.scheduledNotifications.get(reminderId);
      
      if (notificationIds && notificationIds.length > 0) {
        await LocalNotifications.cancel({
          notifications: notificationIds.map(id => ({ id }))
        });
        
        this.scheduledNotifications.delete(reminderId);
        console.log(`[NATIVE-NOTIFICATIONS] Cancelled ${notificationIds.length} notifications for reminder ${reminderId}`);
      }
      
      return true;
    } catch (error) {
      console.error('[NATIVE-NOTIFICATIONS] Failed to cancel reminder:', error);
      return false;
    }
  }

  private async cancelLocalNotificationsForReminder(medicationId: string, reminderTime: string): Promise<void> {
    try {
      // Cancel all pending local notifications that match this medication/time
      const { notifications } = await LocalNotifications.getPending();
      
      const toCancel = notifications.filter(notification => 
        notification.extra?.medicationId === medicationId && 
        notification.extra?.reminderTime === reminderTime
      );
      
      if (toCancel.length > 0) {
        await LocalNotifications.cancel({
          notifications: toCancel.map(n => ({ id: n.id }))
        });
        
        console.log(`[NATIVE-NOTIFICATIONS] Cancelled ${toCancel.length} local notifications`);
      }
    } catch (error) {
      console.error('[NATIVE-NOTIFICATIONS] Error cancelling local notifications:', error);
    }
  }

  async scheduleAllActiveReminders(userId: string): Promise<boolean> {
    try {
      console.log('[NATIVE-NOTIFICATIONS] Scheduling all active reminders for user:', userId);
      
      // Fetch all active reminders for the user
      const { data: reminders, error } = await supabase
        .from('medication_reminders')
        .select(`
          *,
          user_medications!inner(
            medication_name,
            dosage
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      if (!reminders || reminders.length === 0) {
        console.log('[NATIVE-NOTIFICATIONS] No active reminders found');
        return true;
      }

      const results = await Promise.all(
        reminders.map(reminder => {
          const reminderData: MedicationReminder = {
            id: reminder.id,
            user_id: reminder.user_id,
            medication_id: reminder.medication_id,
            reminder_time: reminder.reminder_time,
            days_of_week: reminder.days_of_week,
            is_active: reminder.is_active,
            notification_settings: typeof reminder.notification_settings === 'object' && reminder.notification_settings
              ? reminder.notification_settings as { sound: boolean; vibration: boolean; led: boolean; }
              : { sound: true, vibration: true, led: true },
            medication: reminder.user_medications
          };
          return this.scheduleReminder(reminderData);
        })
      );

      const successCount = results.filter(r => r).length;
      console.log(`[NATIVE-NOTIFICATIONS] Successfully scheduled ${successCount}/${reminders.length} reminders`);
      
      return successCount > 0;
    } catch (error) {
      console.error('[NATIVE-NOTIFICATIONS] Failed to schedule all reminders:', error);
      return false;
    }
  }

  isServiceInitialized(): boolean {
    return this.isInitialized;
  }
}

export const nativeNotificationManager = new NativeNotificationManager();