import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, PushNotificationSchema, ActionPerformed, PushNotificationToken } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { supabase } from '@/integrations/supabase/client';

export interface CameraPhoto {
  webPath?: string;
  format: string;
  saved: boolean;
}

class CapacitorService {
  isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  getPlatform(): string {
    return Capacitor.getPlatform();
  }

  async takePicture(): Promise<CameraPhoto | null> {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      return {
        webPath: photo.dataUrl,
        format: photo.format,
        saved: false
      };
    } catch (error) {
      console.error('Error taking picture:', error);
      return null;
    }
  }

  async selectFromGallery(): Promise<CameraPhoto | null> {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });

      return {
        webPath: photo.dataUrl,
        format: photo.format,
        saved: false
      };
    } catch (error) {
      console.error('Error selecting from gallery:', error);
      return null;
    }
  }

  async checkPermissions(): Promise<boolean> {
    try {
      const permissions = await Camera.checkPermissions();
      return permissions.camera === 'granted' && permissions.photos === 'granted';
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const permissions = await Camera.requestPermissions({
        permissions: ['camera', 'photos']
      });
      return permissions.camera === 'granted' && permissions.photos === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  // Push Notification Methods
  async checkPushPermissions(): Promise<boolean> {
    try {
      if (!this.isNative()) return false;
      
      const permissions = await PushNotifications.checkPermissions();
      return permissions.receive === 'granted';
    } catch (error) {
      console.error('Error checking push permissions:', error);
      return false;
    }
  }

  async requestPushPermissions(): Promise<boolean> {
    try {
      if (!this.isNative()) return false;

      console.log('[CAPACITOR] Requesting push permissions...');
      const permissions = await PushNotifications.requestPermissions();
      console.log('[CAPACITOR] Push permissions result:', permissions);
      
      if (permissions.receive === 'granted') {
        // Register for push notifications
        await PushNotifications.register();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting push permissions:', error);
      return false;
    }
  }

  async checkLocalNotificationPermissions(): Promise<boolean> {
    try {
      if (!this.isNative()) return false;
      
      const permissions = await LocalNotifications.checkPermissions();
      return permissions.display === 'granted';
    } catch (error) {
      console.error('Error checking local notification permissions:', error);
      return false;
    }
  }

  async requestLocalNotificationPermissions(): Promise<boolean> {
    try {
      if (!this.isNative()) return false;

      console.log('[CAPACITOR] Requesting local notification permissions...');
      const permissions = await LocalNotifications.requestPermissions();
      console.log('[CAPACITOR] Local notification permissions result:', permissions);
      
      return permissions.display === 'granted';
    } catch (error) {
      console.error('Error requesting local notification permissions:', error);
      return false;
    }
  }

  // Initialize notification listeners
  initializeNotificationListeners(): void {
    if (!this.isNative()) return;

    console.log('[CAPACITOR] Setting up notification listeners...');

    // Handle registration success
    PushNotifications.addListener('registration', async (token: PushNotificationToken) => {
      console.log('[CAPACITOR] Push registration success, token: ' + token.value);
      
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Store device token in database
          await supabase
            .from('device_tokens')
            .upsert({
              user_id: user.id,
              token: token.value,
              platform: this.getPlatform(),
              is_active: true,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,token'
            });
          
          console.log('[CAPACITOR] Device token stored in database');
        }
      } catch (error) {
        console.error('[CAPACITOR] Error storing device token:', error);
      }
    });

    // Handle registration error
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('[CAPACITOR] Push registration error: ', error);
    });

    // Handle incoming push notifications
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('[CAPACITOR] Push notification received: ', notification);
      
      // Dispatch custom event for app to handle
      window.dispatchEvent(new CustomEvent('push-notification-received', {
        detail: notification
      }));
    });

    // Handle notification tap
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('[CAPACITOR] Push notification action performed: ', notification);
      
      // Dispatch custom event for app to handle
      window.dispatchEvent(new CustomEvent('push-notification-action', {
        detail: notification
      }));
    });

    // Handle local notification tap
    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      console.log('[CAPACITOR] Local notification action performed: ', notification);
      
      // Dispatch custom event for app to handle
      window.dispatchEvent(new CustomEvent('local-notification-action', {
        detail: notification
      }));
    });
  }

  // Performance optimization for mobile
  optimizeForMobile(): void {
    if (this.isNative()) {
      // Disable certain features on mobile for better performance
      document.body.classList.add('mobile-optimized');
      
      // Reduce animation duration
      document.documentElement.style.setProperty('--animation-duration', '200ms');
      
      // Add mobile-specific CSS classes
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        );
      }
    }
  }

  // Handle app lifecycle events
  setupAppLifecycleListeners(): void {
    if (this.isNative()) {
      document.addEventListener('pause', () => {
        console.log('App paused');
        // Save any pending data
      });

      document.addEventListener('resume', () => {
        console.log('App resumed');
        // Refresh data if needed
      });
    }
  }

  // Network status for mobile
  getNetworkStatus(): Promise<{ connected: boolean; connectionType: string }> {
    return new Promise((resolve) => {
      if (navigator.onLine) {
        resolve({ connected: true, connectionType: 'unknown' });
      } else {
        resolve({ connected: false, connectionType: 'none' });
      }
    });
  }

  // Device info for analytics
  async getDeviceInfo(): Promise<Record<string, any>> {
    const info: Record<string, any> = {
      platform: this.getPlatform(),
      isNative: this.isNative(),
      userAgent: navigator.userAgent,
      screen: {
        width: screen.width,
        height: screen.height,
        pixelRatio: window.devicePixelRatio
      }
    };

    // Add more device-specific info if available
    if ('hardwareConcurrency' in navigator) {
      info.cores = navigator.hardwareConcurrency;
    }

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      info.network = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      };
    }

    return info;
  }
}

export const capacitorService = new CapacitorService();