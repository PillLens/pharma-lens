import { capacitorService } from './capacitorService';
import { notificationService } from './notificationService';
import { oneSignalService } from './oneSignalService';
import { environmentService } from './environmentService';
import { nativeNotificationManager } from './nativeNotificationManager';

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
      
      console.log('[UNIFIED-MANAGER] Initializing for platform:', this.isNative ? 'native' : 'web');
      
      if (this.isNative) {
        // Initialize native notification manager for mobile apps
        const success = await nativeNotificationManager.initialize();
        if (!success) {
          console.warn('[UNIFIED-MANAGER] Native notification manager failed to initialize');
          return false;
        }
      } else if (environmentService.isFeatureEnabled('push-notifications')) {
        // Initialize OneSignal for web
        const appId = environmentService.env.oneSignalAppId;
        if (appId) {
          await oneSignalService.initialize(appId);
        }
      }

      this.isInitialized = true;
      console.log('[UNIFIED-MANAGER] Successfully initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize notification manager:', error);
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      if (this.isNative) {
        // Request both push and local notification permissions for native apps
        const pushPermission = await capacitorService.requestPushPermissions();
        const localPermission = await capacitorService.requestLocalNotificationPermissions();
        
        console.log('[UNIFIED-MANAGER] Permission results - Push:', pushPermission, 'Local:', localPermission);
        
        // Local notifications are essential for medication reminders
        return localPermission;
      } else {
        // Use OneSignal permission request for web
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
        // Check both push and local notification permissions
        const pushPermission = await capacitorService.checkPushPermissions();
        const localPermission = await capacitorService.checkLocalNotificationPermissions();
        
        return localPermission; // Local notifications are more important for medication reminders
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
          message: 'This is a test notification from PillLens',
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
      if (this.isNative) {
        // For native apps, ensure native notification manager is initialized
        if (!nativeNotificationManager.isServiceInitialized()) {
          await nativeNotificationManager.initialize();
        }
        
        // Schedule all active reminders for this user
        await nativeNotificationManager.scheduleAllActiveReminders(userId);
        
        return true;
      } else if (environmentService.isFeatureEnabled('push-notifications')) {
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