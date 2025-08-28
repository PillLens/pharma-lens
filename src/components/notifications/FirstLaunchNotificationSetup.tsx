import React, { useEffect, useState } from 'react';
import { NotificationPermissionDialog } from './NotificationPermissionDialog';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/hooks/useAuth';
import { environmentService } from '@/services/environmentService';
import { oneSignalService } from '@/services/oneSignalService';
import { supabase } from '@/integrations/supabase/client';

export const FirstLaunchNotificationSetup: React.FC = () => {
  const { user } = useAuth();
  const { preferences, updatePreferences } = usePushNotifications();
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  useEffect(() => {
    if (user) {
      checkFirstLaunch();
    }
  }, [user]);

  const checkFirstLaunch = async () => {
    if (!user) return;

    try {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id' as any, user.id as any)
        .single();

      if (error) throw error;

      const hasNotAsked = !(data as any)?.notification_permission_asked;
      setIsFirstLaunch(hasNotAsked);
      
      // Show dialog if notifications are enabled and we haven't asked before
      if (hasNotAsked && environmentService.isFeatureEnabled('push-notifications')) {
        setShowDialog(true);
      }
    } catch (error) {
      console.error('Error checking notification first launch:', error);
    }
  };

  const handleAllow = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Request notification permission from OneSignal
      if (environmentService.isFeatureEnabled('push-notifications')) {
        await oneSignalService.optIn();
        await oneSignalService.registerUser(user.id);
      }

      // Update preferences to enable notifications
      await updatePreferences({ enabled: true });

      // Mark that we've asked for permission
      await (supabase as any)
        .from('profiles')
        .update({ notification_permission_asked: true } as any)
        .eq('id' as any, user.id as any);

      setShowDialog(false);
    } catch (error) {
      console.error('Error enabling notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeny = async () => {
    if (!user) return;

    try {
      // Mark that we've asked for permission (even if denied)
      await (supabase as any)
        .from('profiles')
        .update({ notification_permission_asked: true } as any)
        .eq('id' as any, user.id as any);

      // Ensure notifications are disabled
      await updatePreferences({ enabled: false });

      setShowDialog(false);
    } catch (error) {
      console.error('Error handling notification denial:', error);
      setShowDialog(false);
    }
  };

  if (!user || !isFirstLaunch || !environmentService.isFeatureEnabled('push-notifications')) {
    return null;
  }

  return (
    <NotificationPermissionDialog
      isOpen={showDialog}
      onAllow={handleAllow}
      onDeny={handleDeny}
      loading={loading}
    />
  );
};