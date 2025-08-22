import { 
  PushNotifications, 
  PushNotificationSchema,
  ActionPerformed,
  Token,
  PermissionStatus 
} from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MedicationReminder {
  id: string;
  medicationName: string;
  time: string;
  daysOfWeek: number[];
  isActive: boolean;
  notificationSettings: {
    sound: boolean;
    vibration: boolean;
    led: boolean;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
}

export class NotificationService {
  private isNative = Capacitor.isNativePlatform();
  private reminderIntervals: Map<string, NodeJS.Timeout> = new Map();

  async initialize(): Promise<boolean> {
    if (!this.isNative) {
      console.log('Push notifications not available on web platform');
      return false;
    }

    try {
      const permission = await this.requestPermissions();
      if (!permission) {
        return false;
      }

      await this.setupListeners();
      await this.registerDevice();
      return true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (!this.isNative) return false;

    try {
      const permission = await PushNotifications.requestPermissions();
      return permission.receive === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  async checkPermissions(): Promise<PermissionStatus> {
    if (!this.isNative) {
      return { receive: 'denied', sound: 'denied' };
    }

    return await PushNotifications.checkPermissions();
  }

  private async setupListeners(): Promise<void> {
    if (!this.isNative) return;

    // Register for push notifications
    await PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token: ' + token.value);
      this.saveDeviceToken(token.value);
    });

    // Handle registration errors
    await PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ', error);
    });

    // Handle push notification received
    await PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push received: ', notification);
      this.handleNotificationReceived(notification);
    });

    // Handle notification action performed
    await PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Push action performed: ', notification);
      this.handleNotificationAction(notification);
    });
  }

  private async registerDevice(): Promise<void> {
    if (!this.isNative) return;

    try {
      await PushNotifications.register();
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  }

  private async saveDeviceToken(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Store token in user metadata or a separate table if needed
      await supabase.auth.updateUser({
        data: { push_token: token }
      });
    } catch (error) {
      console.error('Error saving device token:', error);
    }
  }

  private handleNotificationReceived(notification: PushNotificationSchema): void {
    toast.info(notification.title || 'Notification', {
      description: notification.body
    });
  }

  private handleNotificationAction(notification: ActionPerformed): void {
    const data = notification.notification.data;
    
    if (data?.type === 'medication_reminder') {
      // Navigate to medication management or handle reminder action
      console.log('Medication reminder action:', data);
    } else if (data?.type === 'safety_alert') {
      // Navigate to safety alerts
      console.log('Safety alert action:', data);
    }
  }

  // Local notifications for medication reminders
  async scheduleMedicationReminders(reminders: MedicationReminder[]): Promise<void> {
    // Clear existing reminders
    this.clearAllReminders();

    for (const reminder of reminders) {
      if (reminder.isActive) {
        this.scheduleReminder(reminder);
      }
    }
  }

  private scheduleReminder(reminder: MedicationReminder): void {
    const scheduleNextReminder = () => {
      const now = new Date();
      const [hours, minutes] = reminder.time.split(':').map(Number);
      
      let nextReminder = new Date();
      nextReminder.setHours(hours, minutes, 0, 0);
      
      // If time has passed today, schedule for tomorrow or next valid day
      if (nextReminder <= now) {
        nextReminder.setDate(nextReminder.getDate() + 1);
      }
      
      // Find next valid day based on daysOfWeek
      while (!reminder.daysOfWeek.includes(this.getDayOfWeek(nextReminder))) {
        nextReminder.setDate(nextReminder.getDate() + 1);
      }
      
      const timeUntilReminder = nextReminder.getTime() - now.getTime();
      
      const timeoutId = setTimeout(() => {
        this.sendMedicationReminder(reminder);
        // Schedule the next occurrence
        scheduleNextReminder();
      }, timeUntilReminder);
      
      this.reminderIntervals.set(reminder.id, timeoutId);
    };
    
    scheduleNextReminder();
  }

  private getDayOfWeek(date: Date): number {
    // Convert JavaScript day (0 = Sunday) to our format (1 = Monday)
    const jsDay = date.getDay();
    return jsDay === 0 ? 7 : jsDay;
  }

  private async sendMedicationReminder(reminder: MedicationReminder): Promise<void> {
    const payload: NotificationPayload = {
      title: 'Medication Reminder',
      body: `Time to take your ${reminder.medicationName}`,
      data: {
        type: 'medication_reminder',
        medicationId: reminder.id,
        medicationName: reminder.medicationName
      }
    };

    await this.sendLocalNotification(payload);
  }

  async sendLocalNotification(payload: NotificationPayload): Promise<void> {
    if (this.isNative && 'Notification' in window) {
      // Use browser notifications as fallback or for web
      if (Notification.permission === 'granted') {
        new Notification(payload.title, {
          body: payload.body,
          data: payload.data,
          badge: payload.badge?.toString()
        });
      }
    } else {
      // Fallback to toast notification
      toast.info(payload.title, {
        description: payload.body
      });
    }
  }

  async sendSafetyAlert(alert: {
    title: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<void> {
    const payload: NotificationPayload = {
      title: alert.title,
      body: alert.message,
      data: {
        type: 'safety_alert',
        severity: alert.severity
      }
    };

    await this.sendLocalNotification(payload);
    
    // Also show toast for immediate visibility
    const toastMethod = alert.severity === 'critical' ? toast.error : 
                       alert.severity === 'high' ? toast.warning : toast.info;
    
    toastMethod(alert.title, {
      description: alert.message,
      duration: alert.severity === 'critical' ? 10000 : 5000
    });
  }

  clearReminder(reminderId: string): void {
    const timeoutId = this.reminderIntervals.get(reminderId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.reminderIntervals.delete(reminderId);
    }
  }

  clearAllReminders(): void {
    for (const timeoutId of this.reminderIntervals.values()) {
      clearTimeout(timeoutId);
    }
    this.reminderIntervals.clear();
  }

  async loadUserReminders(): Promise<MedicationReminder[]> {
    try {
      const { data, error } = await supabase
        .from('medication_reminders')
        .select(`
          id,
          medication_id,
          reminder_time,
          days_of_week,
          is_active,
          notification_settings,
          user_medications!inner(medication_name)
        `)
        .eq('is_active', true);

      if (error) throw error;

      return data?.map(reminder => ({
        id: reminder.id,
        medicationName: reminder.user_medications.medication_name,
        time: reminder.reminder_time,
        daysOfWeek: reminder.days_of_week,
        isActive: reminder.is_active,
        notificationSettings: reminder.notification_settings as any
      })) || [];
    } catch (error) {
      console.error('Error loading reminders:', error);
      return [];
    }
  }

  async createReminder(medicationId: string, reminderData: {
    time: string;
    daysOfWeek: number[];
    notificationSettings?: any;
  }): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('medication_reminders')
        .insert({
          user_id: user.id,
          medication_id: medicationId,
          reminder_time: reminderData.time,
          days_of_week: reminderData.daysOfWeek,
          notification_settings: reminderData.notificationSettings || {
            sound: true,
            vibration: true,
            led: true
          }
        });

      if (error) throw error;

      // Reload and reschedule reminders
      const reminders = await this.loadUserReminders();
      await this.scheduleMedicationReminders(reminders);
      
      toast.success('Reminder created successfully');
    } catch (error) {
      console.error('Error creating reminder:', error);
      toast.error('Failed to create reminder');
    }
  }

  async updateReminder(reminderId: string, updates: Partial<{
    time: string;
    daysOfWeek: number[];
    isActive: boolean;
    notificationSettings: any;
  }>): Promise<void> {
    try {
      const { error } = await supabase
        .from('medication_reminders')
        .update({
          ...(updates.time && { reminder_time: updates.time }),
          ...(updates.daysOfWeek && { days_of_week: updates.daysOfWeek }),
          ...(updates.isActive !== undefined && { is_active: updates.isActive }),
          ...(updates.notificationSettings && { notification_settings: updates.notificationSettings })
        })
        .eq('id', reminderId);

      if (error) throw error;

      // Reload and reschedule reminders
      const reminders = await this.loadUserReminders();
      await this.scheduleMedicationReminders(reminders);
      
      toast.success('Reminder updated successfully');
    } catch (error) {
      console.error('Error updating reminder:', error);
      toast.error('Failed to update reminder');
    }
  }

  async deleteReminder(reminderId: string): Promise<void> {
    try {
      this.clearReminder(reminderId);
      
      const { error } = await supabase
        .from('medication_reminders')
        .delete()
        .eq('id', reminderId);

      if (error) throw error;
      
      toast.success('Reminder deleted successfully');
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast.error('Failed to delete reminder');
    }
  }
}

// Singleton instance
export const notificationService = new NotificationService();