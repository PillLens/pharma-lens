import { capacitorService } from './capacitorService';
import { notificationService } from './notificationService';
import { oneSignalService } from './oneSignalService';
import { environmentService } from './environmentService';

export interface NotificationPreferences {
  enabled: boolean;
  reminders: boolean;
  missedDose: boolean;
  family: boolean;
  product: boolean;
  quietHours: {
    start: string;
    end: string;
  };
}

class UnifiedNotificationManager {
  private isInitialized = false;
  private isNative = false;

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      this.isNative = capacitorService.isNative();
      
      if (this.isNative) {
        // Initialize Capacitor notifications for native apps
        await notificationService.initialize();
      } else if (environmentService.isFeatureEnabled('push-notifications')) {
        // Initialize OneSignal for web
        const appId = environmentService.env.oneSignalAppId;
        if (appId) {
          await oneSignalService.initialize(appId);
        }
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize notification manager:', error);
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      if (this.isNative) {
        // Use Capacitor permission request
        return await capacitorService.requestPermissions();
      } else {
        // Use OneSignal permission request
        return await oneSignalService.optIn();
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  async checkPermission(): Promise<boolean> {
    try {
      if (this.isNative) {
        return await capacitorService.checkPermissions();
      } else {
        return await oneSignalService.isSubscribed();
      }
    } catch (error) {
      console.error('Failed to check notification permission:', error);
      return false;
    }
  }

  async sendTestNotification(): Promise<boolean> {
    try {
      if (this.isNative) {
        return await notificationService.sendSafetyAlert({
          id: 'test',
          type: 'emergency',
          title: 'Test Notification',
          message: 'This is a test notification from CareCapsule',
          severity: 'low'
        });
      } else {
        return await oneSignalService.sendTestNotification();
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
      return false;
    }
  }

  async registerUser(userId: string): Promise<boolean> {
    try {
      if (!this.isNative && environmentService.isFeatureEnabled('push-notifications')) {
        return await oneSignalService.registerUser(userId);
      }
      return true;
    } catch (error) {
      console.error('Failed to register user for notifications:', error);
      return false;
    }
  }

  async updatePreferences(preferences: NotificationPreferences): Promise<boolean> {
    try {
      if (!this.isNative && environmentService.isFeatureEnabled('push-notifications')) {
        await oneSignalService.updateNotificationPreferences(preferences);
      }
      // For native apps, preferences are handled by the notification service
      return true;
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      return false;
    }
  }

  getManagerType(): 'native' | 'web' {
    return this.isNative ? 'native' : 'web';
  }

  isServiceInitialized(): boolean {
    return this.isInitialized;
  }
}

export const unifiedNotificationManager = new UnifiedNotificationManager();