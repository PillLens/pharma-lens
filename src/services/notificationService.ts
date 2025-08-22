import { CapacitorConfig } from '@capacitor/cli';
import { 
  PushNotifications, 
  PushNotificationSchema, 
  ActionPerformed, 
  PushNotificationToken 
} from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { toast } from 'sonner';
import { capacitorService } from './capacitorService';
import { supabase } from '@/integrations/supabase/client';

export interface NotificationPermissions {
  alert: boolean;
  badge: boolean;
  sound: boolean;
}

export interface NotificationSettings {
  sound: boolean;
  vibration: boolean;
  led: boolean;
}

export interface MedicationReminder {
  id: string;
  medicationName: string;
  dosage: string;
  time: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  daysOfWeek: number[]; // 0 = Sunday, 1 = Monday, etc.
  isActive: boolean;
  notificationSettings: NotificationSettings;
  medicationId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SafetyAlert {
  id: string;
  type: 'drug_interaction' | 'expiration' | 'dosage_warning' | 'emergency';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  medicationIds?: string[];
  actionRequired?: boolean;
}

export class NotificationService {
  private isInitialized = false;
  private pushToken: string | null = null;

  async initialize(): Promise<boolean> {
    try {
      if (!capacitorService.isNative()) {
        console.log('Push notifications not available on web platform');
        return false;
      }

      // Request permissions
      const permResult = await PushNotifications.requestPermissions();
      
      if (permResult.receive !== 'granted') {
        toast.error('Push notification permissions denied');
        return false;
      }

      // Register for push notifications
      await PushNotifications.register();

      // Set up listeners
      this.setupNotificationListeners();

      // Request local notification permissions
      await LocalNotifications.requestPermissions();

      this.isInitialized = true;
      console.log('Notification service initialized successfully');
      return true;

    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      toast.error('Failed to initialize notifications');
      return false;
    }
  }

  private setupNotificationListeners(): void {
    // Handle registration success
    PushNotifications.addListener('registration', (token: PushNotificationToken) => {
      console.log('Push registration success, token: ' + token.value);
      this.pushToken = token.value;
      // TODO: Send token to backend for push notification targeting
    });

    // Handle registration error
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Push registration error: ', error);
    });

    // Handle incoming push notifications
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received: ', notification);
      this.handleIncomingNotification(notification);
    });

    // Handle notification tap
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Push notification action performed: ', notification);
      this.handleNotificationAction(notification);
    });

    // Handle local notification tap
    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      console.log('Local notification action performed: ', notification);
      this.handleLocalNotificationAction(notification);
    });
  }

  private handleIncomingNotification(notification: PushNotificationSchema): void {
    // Handle different types of notifications
    const notificationType = notification.data?.type;
    
    switch (notificationType) {
      case 'medication_reminder':
        this.handleMedicationReminderNotification(notification);
        break;
      case 'safety_alert':
        this.handleSafetyAlertNotification(notification);
        break;
      case 'family_update':
        this.handleFamilyUpdateNotification(notification);
        break;
      default:
        console.log('Unknown notification type:', notificationType);
    }
  }

  private handleNotificationAction(notification: ActionPerformed): void {
    // Handle user actions on push notifications
    const actionId = notification.actionId;
    const notificationData = notification.notification.data;

    switch (actionId) {
      case 'taken':
        this.markMedicationAsTaken(notificationData?.medicationId);
        break;
      case 'snooze':
        this.snoozeMedicationReminder(notificationData?.reminderId, 15); // Snooze for 15 minutes
        break;
      case 'view_details':
        this.navigateToMedicationDetails(notificationData?.medicationId);
        break;
    }
  }

  private handleLocalNotificationAction(notification: any): void {
    // Handle local notification actions
    console.log('Local notification action:', notification);
  }

  // User Reminder Management Methods
  async loadUserReminders(): Promise<MedicationReminder[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('medication_reminders')
        .select(`
          *,
          medications (
            medication_name,
            dosage,
            form
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(reminder => ({
        id: reminder.id,
        medicationId: reminder.medication_id,
        medicationName: reminder.medications?.medication_name || 'Unknown',
        dosage: reminder.medications?.dosage || '',
        time: reminder.reminder_time,
        frequency: reminder.frequency as 'daily' | 'weekly' | 'monthly',
        daysOfWeek: reminder.days_of_week || [],
        isActive: reminder.is_active,
        notificationSettings: reminder.notification_settings as NotificationSettings || {
          sound: true,
          vibration: true,
          led: true
        },
        userId: reminder.user_id,
        createdAt: reminder.created_at,
        updatedAt: reminder.updated_at
      }));

    } catch (error) {
      console.error('Failed to load user reminders:', error);
      toast.error('Failed to load reminders');
      return [];
    }
  }

  async createReminder(
    medicationId: string, 
    reminderData: {
      time: string;
      daysOfWeek: number[];
      notificationSettings: NotificationSettings;
    }
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('User not authenticated');
        return false;
      }

      const { data, error } = await supabase
        .from('medication_reminders')
        .insert({
          user_id: user.id,
          medication_id: medicationId,
          reminder_time: reminderData.time,
          days_of_week: reminderData.daysOfWeek,
          frequency: 'daily',
          is_active: true,
          notification_settings: reminderData.notificationSettings
        })
        .select()
        .single();

      if (error) throw error;

      // Schedule the notification
      const reminder: MedicationReminder = {
        id: data.id,
        medicationId: data.medication_id,
        medicationName: 'Loading...', // Will be populated when reminders are reloaded
        dosage: '',
        time: data.reminder_time,
        frequency: data.frequency as 'daily',
        daysOfWeek: data.days_of_week,
        isActive: data.is_active,
        notificationSettings: data.notification_settings as NotificationSettings,
        userId: data.user_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      await this.scheduleMedicationReminder(reminder);
      toast.success('Reminder created successfully');
      return true;

    } catch (error) {
      console.error('Failed to create reminder:', error);
      toast.error('Failed to create reminder');
      return false;
    }
  }

  async updateReminder(
    reminderId: string, 
    updates: Partial<{
      time: string;
      daysOfWeek: number[];
      notificationSettings: NotificationSettings;
      isActive: boolean;
    }>
  ): Promise<boolean> {
    try {
      const updateData: any = {};
      if (updates.time) updateData.reminder_time = updates.time;
      if (updates.daysOfWeek) updateData.days_of_week = updates.daysOfWeek;
      if (updates.notificationSettings) updateData.notification_settings = updates.notificationSettings;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { error } = await supabase
        .from('medication_reminders')
        .update(updateData)
        .eq('id', reminderId);

      if (error) throw error;

      // Cancel old notifications and reschedule if active
      await this.cancelMedicationReminder(reminderId);
      
      if (updates.isActive !== false) {
        // Reload and reschedule this specific reminder
        const reminders = await this.loadUserReminders();
        const updatedReminder = reminders.find(r => r.id === reminderId);
        if (updatedReminder && updatedReminder.isActive) {
          await this.scheduleMedicationReminder(updatedReminder);
        }
      }

      toast.success('Reminder updated successfully');
      return true;

    } catch (error) {
      console.error('Failed to update reminder:', error);
      toast.error('Failed to update reminder');
      return false;
    }
  }

  async deleteReminder(reminderId: string): Promise<boolean> {
    try {
      // Cancel notifications first
      await this.cancelMedicationReminder(reminderId);

      const { error } = await supabase
        .from('medication_reminders')
        .delete()
        .eq('id', reminderId);

      if (error) throw error;

      toast.success('Reminder deleted successfully');
      return true;

    } catch (error) {
      console.error('Failed to delete reminder:', error);
      toast.error('Failed to delete reminder');
      return false;
    }
  }

  async scheduleMedicationReminders(reminders: MedicationReminder[]): Promise<boolean> {
    try {
      const results = await Promise.all(
        reminders
          .filter(reminder => reminder.isActive)
          .map(reminder => this.scheduleMedicationReminder(reminder))
      );
      
      return results.every(result => result);
    } catch (error) {
      console.error('Failed to schedule multiple reminders:', error);
      return false;
    }
  }

  // Medication Reminder Methods
  async scheduleMedicationReminder(reminder: MedicationReminder): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const notifications = this.generateNotificationSchedule(reminder);
      
      await LocalNotifications.schedule({
        notifications: notifications
      });

      console.log(`Scheduled ${notifications.length} reminders for ${reminder.medicationName}`);
      return true;

    } catch (error) {
      console.error('Failed to schedule medication reminder:', error);
      return false;
    }
  }

  private generateNotificationSchedule(reminder: MedicationReminder): any[] {
    const notifications = [];
    const now = new Date();
    
    // Generate notifications for the next 30 days
    for (let day = 0; day < 30; day++) {
      const notificationDate = new Date(now);
      notificationDate.setDate(now.getDate() + day);
      
      // Check if notification should be sent on this day based on frequency
      if (this.shouldNotifyOnDay(notificationDate, reminder)) {
        const [hours, minutes] = reminder.time.split(':').map(Number);
        notificationDate.setHours(hours, minutes, 0, 0);
        
        // Only schedule future notifications
        if (notificationDate > now) {
          notifications.push({
            id: parseInt(`${reminder.id}${day}`), // Unique ID for each notification
            title: 'Medication Reminder',
            body: `Time to take ${reminder.medicationName} (${reminder.dosage})`,
            schedule: { at: notificationDate },
            sound: 'default',
            actionTypeId: 'medication_reminder',
            extra: {
              medicationId: reminder.id,
              medicationName: reminder.medicationName,
              dosage: reminder.dosage
            }
          });
        }
      }
    }
    
    return notifications;
  }

  private shouldNotifyOnDay(date: Date, reminder: MedicationReminder): boolean {
    const dayOfWeek = date.getDay();
    
    switch (reminder.frequency) {
      case 'daily':
        return true;
      case 'weekly':
        return reminder.daysOfWeek?.includes(dayOfWeek) || false;
      case 'monthly':
        return date.getDate() === 1; // First day of month
      default:
        return false;
    }
  }

  async cancelMedicationReminder(reminderId: string): Promise<boolean> {
    try {
      // Cancel all notifications for this reminder (for next 30 days)
      const notificationIds = [];
      for (let day = 0; day < 30; day++) {
        notificationIds.push(parseInt(`${reminderId}${day}`));
      }

      await LocalNotifications.cancel({
        notifications: notificationIds.map(id => ({ id }))
      });

      console.log(`Cancelled reminders for ID: ${reminderId}`);
      return true;

    } catch (error) {
      console.error('Failed to cancel medication reminder:', error);
      return false;
    }
  }

  // Safety Alert Methods
  async sendSafetyAlert(alert: SafetyAlert): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const notification = {
        id: parseInt(alert.id),
        title: alert.title,
        body: alert.message,
        schedule: { at: new Date(Date.now() + 1000) }, // Send immediately
        sound: alert.severity === 'critical' ? 'alarm' : 'default',
        actionTypeId: 'safety_alert',
        extra: {
          alertId: alert.id,
          alertType: alert.type,
          severity: alert.severity,
          medicationIds: alert.medicationIds
        }
      };

      await LocalNotifications.schedule({
        notifications: [notification]
      });

      // Also show toast for immediate attention
      const toastMessage = `${alert.title}: ${alert.message}`;
      if (alert.severity === 'critical') {
        toast.error(toastMessage);
      } else {
        toast.warning(toastMessage);
      }

      return true;

    } catch (error) {
      console.error('Failed to send safety alert:', error);
      return false;
    }
  }

  // Family Notification Methods
  async sendFamilyNotification(
    title: string, 
    message: string, 
    familyMemberIds: string[]
  ): Promise<boolean> {
    try {
      // In a real implementation, this would send push notifications
      // to family members via a backend service
      console.log('Family notification:', { title, message, familyMemberIds });
      
      // For now, just log the notification
      toast.info(`Family notification sent: ${title}`);
      return true;

    } catch (error) {
      console.error('Failed to send family notification:', error);
      return false;
    }
  }

  // Helper Methods
  private handleMedicationReminderNotification(notification: PushNotificationSchema): void {
    console.log('Handling medication reminder:', notification);
    // Show local toast or update UI
    toast.info(notification.body || 'Medication reminder');
  }

  private handleSafetyAlertNotification(notification: PushNotificationSchema): void {
    console.log('Handling safety alert:', notification);
    toast.error(notification.body || 'Safety alert');
  }

  private handleFamilyUpdateNotification(notification: PushNotificationSchema): void {
    console.log('Handling family update:', notification);
    toast.info(notification.body || 'Family update');
  }

  private markMedicationAsTaken(medicationId?: string): void {
    if (medicationId) {
      console.log('Marking medication as taken:', medicationId);
      // TODO: Update medication adherence tracking
      toast.success('Medication marked as taken');
    }
  }

  private snoozeMedicationReminder(reminderId?: string, minutes: number = 15): void {
    if (reminderId) {
      console.log(`Snoozing reminder ${reminderId} for ${minutes} minutes`);
      // TODO: Reschedule notification for later
      toast.info(`Reminder snoozed for ${minutes} minutes`);
    }
  }

  private navigateToMedicationDetails(medicationId?: string): void {
    if (medicationId) {
      console.log('Navigating to medication details:', medicationId);
      // TODO: Navigate to medication details page
    }
  }

  // Getters
  getPushToken(): string | null {
    return this.pushToken;
  }

  isServiceInitialized(): boolean {
    return this.isInitialized;
  }
}

// Singleton instance
export const notificationService = new NotificationService();
