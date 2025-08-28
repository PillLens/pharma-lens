import { useState, useEffect } from 'react';
import { unifiedNotificationManager } from '@/services/unifiedNotificationManager';
import { environmentService } from '@/services/environmentService';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

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

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: true,
    reminders: true,
    missedDose: true,
    family: true,
    product: false,
    quietHours: {
      start: '22:00',
      end: '07:00'
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
      .eq('id' as any, user.id as any)
        .single();

      if (error) throw error;

    if (data) {
      const prefs = (data as any).notification_preferences;
      const emergencyOnly = prefs?.emergency_only || false;
        setPreferences({
          enabled: prefs.enabled ?? true,
          reminders: prefs.reminders ?? true,
          missedDose: prefs.missedDose ?? true,
          family: prefs.family ?? true,
          product: prefs.product ?? false,
          quietHours: {
            start: prefs.quietHours?.start ?? '22:00',
            end: prefs.quietHours?.end ?? '07:00'
          }
        });
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    if (!user) return false;

    try {
      setLoading(true);
      
      const updatedPreferences = { ...preferences, ...newPreferences };
      
      // Update notification manager preferences
      if (environmentService.isFeatureEnabled('push-notifications')) {
        await unifiedNotificationManager.updatePreferences(updatedPreferences);
      }

      // Update database
      const { error } = await supabase
        .from('profiles')
        .update({
          notification_preferences: updatedPreferences as any
        } as any)
        .eq('id' as any, user.id as any);

      if (error) throw error;

      setPreferences(updatedPreferences);
      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async (): Promise<boolean> => {
    if (!environmentService.isFeatureEnabled('push-notifications')) {
      console.warn('Push notifications not enabled');
      return false;
    }

    return unifiedNotificationManager.sendTestNotification();
  };

  const sendCaregiverPoke = async (toUserId: string, groupId: string, medId?: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase.functions.invoke('send-caregiver-poke', {
        body: {
          to_user_id: toUserId,
          from_user_id: user.id,
          group_id: groupId,
          med_id: medId
        }
      });

      if (error) {
        console.error('Error sending caregiver poke:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in sendCaregiverPoke:', error);
      return false;
    }
  };

  return {
    preferences,
    loading,
    updatePreferences,
    sendTestNotification,
    sendCaregiverPoke,
    isOneSignalReady: unifiedNotificationManager.isServiceInitialized(),
  };
};