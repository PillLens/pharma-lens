import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    OneSignal: any;
  }
}

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

export class OneSignalService {
  private isInitialized = false;
  private playerId: string | null = null;
  private userId: string | null = null;

  async initialize(appId: string): Promise<boolean> {
    try {
      // Load OneSignal SDK dynamically
      if (!window.OneSignal) {
        const script = document.createElement('script');
        script.src = 'https://cdn.onesignal.com/sdks/OneSignalSDK.js';
        script.async = true;
        document.head.appendChild(script);
        
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      window.OneSignal = window.OneSignal || [];
      
      const OneSignal = window.OneSignal;
      
      await new Promise<void>((resolve) => {
        OneSignal.push(function() {
          OneSignal.init({
            appId: appId,
            safari_web_id: appId,
            notifyButton: {
              enable: false, // We'll use our own UI
            },
            allowLocalhostAsSecureOrigin: true,
          });
          resolve();
        });
      });

      this.isInitialized = true;
      console.log('OneSignal initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize OneSignal:', error);
      return false;
    }
  }

  async registerUser(userId: string): Promise<boolean> {
    if (!this.isInitialized || !window.OneSignal) {
      console.error('OneSignal not initialized');
      return false;
    }

    try {
      this.userId = userId;
      const OneSignal = window.OneSignal;

      return new Promise<boolean>((resolve) => {
        OneSignal.push(() => {
          // Get user ID
          OneSignal.getUserId((playerId: string) => {
            if (playerId) {
              this.playerId = playerId;
              
              // Set external user ID
              OneSignal.setExternalUserId(userId);
              
              // Store player ID in database
              this.storePlayerIdInDatabase(userId, playerId).then(() => {
                console.log('User registered with OneSignal:', playerId);
                resolve(true);
              }).catch(() => {
                resolve(false);
              });
            } else {
              resolve(false);
            }
          });
        });
      });

    } catch (error) {
      console.error('Failed to register user with OneSignal:', error);
      return false;
    }
  }

  private async storePlayerIdInDatabase(userId: string, playerId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('device_tokens')
        .upsert({
          user_id: userId,
          token: playerId, // Required field
          onesignal_player_id: playerId,
          platform: 'web',
          is_active: true,
          language: navigator.language.substring(0, 2),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }, {
          onConflict: 'token'
        });

      if (error) {
        console.error('Error storing player ID in database:', error);
      }
    } catch (error) {
      console.error('Error in storePlayerIdInDatabase:', error);
    }
  }

  async updateNotificationPreferences(preferences: NotificationPreferences): Promise<void> {
    if (!this.isInitialized || !this.userId || !window.OneSignal) {
      return;
    }

    try {
      const OneSignal = window.OneSignal;

      OneSignal.push(() => {
        // Update master subscription status
        if (preferences.enabled) {
          OneSignal.showNativePrompt();
          OneSignal.setSubscription(true);
        } else {
          OneSignal.setSubscription(false);
        }

        // Update tags for granular control
        const tags = {
          notif_enabled: preferences.enabled.toString(),
          notif_reminders: preferences.reminders.toString(),
          notif_missed: preferences.missedDose.toString(),
          notif_family: preferences.family.toString(),
          notif_product: preferences.product.toString(),
          quiet_start: preferences.quietHours.start,
          quiet_end: preferences.quietHours.end,
          lang: navigator.language.substring(0, 2),
        };

        OneSignal.sendTags(tags);
      });

      // Update database - cast to any to avoid type issues
      await supabase
        .from('profiles')
        .update({
          notification_preferences: preferences as any
        })
        .eq('id', this.userId);

      console.log('Notification preferences updated');
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
    }
  }

  async sendTestNotification(): Promise<boolean> {
    if (!this.playerId) {
      console.error('No player ID available for test notification');
      return false;
    }

    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: this.userId,
          title: 'Test Notification',
          body: 'This is a test notification from PharmaLens!',
          data: {
            type: 'test',
            timestamp: new Date().toISOString()
          },
          deviceToken: this.playerId
        }
      });

      if (error) {
        console.error('Failed to send test notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  }

  async optIn(): Promise<boolean> {
    if (!this.isInitialized || !window.OneSignal) return false;
    
    try {
      const OneSignal = window.OneSignal;
      return new Promise<boolean>((resolve) => {
        OneSignal.push(() => {
          OneSignal.showNativePrompt().then((result: any) => {
            if (result) {
              OneSignal.setSubscription(true);
              resolve(true);
            } else {
              resolve(false);
            }
          }).catch(() => {
            resolve(false);
          });
        });
      });
    } catch (error) {
      console.error('Failed to opt in to notifications:', error);
      return false;
    }
  }

  async optOut(): Promise<void> {
    if (!this.isInitialized || !window.OneSignal) return;
    
    try {
      const OneSignal = window.OneSignal;
      OneSignal.push(() => {
        OneSignal.setSubscription(false);
      });
    } catch (error) {
      console.error('Failed to opt out of notifications:', error);
    }
  }

  async isSubscribed(): Promise<boolean> {
    if (!this.isInitialized || !window.OneSignal) return false;
    
    try {
      const OneSignal = window.OneSignal;
      return new Promise<boolean>((resolve) => {
        OneSignal.push(() => {
          OneSignal.isPushNotificationsEnabled((enabled: boolean) => {
            resolve(enabled);
          });
        });
      });
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      return false;
    }
  }

  getPlayerId(): string | null {
    return this.playerId;
  }

  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  async cleanup(): Promise<void> {
    if (this.userId && this.playerId) {
      try {
        // Mark device token as inactive
        await supabase
          .from('device_tokens')
          .update({ is_active: false })
          .eq('token', this.playerId);
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    }
    
    this.playerId = null;
    this.userId = null;
  }
}

// Export singleton instance
export const oneSignalService = new OneSignalService();