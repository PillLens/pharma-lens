import { useState, useEffect } from 'react';
import { oneSignalService } from '@/services/oneSignalService';
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
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data?.notification_preferences) {
        setPreferences(data.notification_preferences as any);
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
      
      // Update OneSignal preferences
      if (environmentService.isFeatureEnabled('push-notifications')) {
        await oneSignalService.updateNotificationPreferences(updatedPreferences);
      }

      // Update database
      const { error } = await supabase
        .from('profiles')
        .update({
          notification_preferences: updatedPreferences as any
        })
        .eq('id', user.id);

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

    return oneSignalService.sendTestNotification();
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
    isOneSignalReady: oneSignalService.isServiceInitialized(),
  };
};