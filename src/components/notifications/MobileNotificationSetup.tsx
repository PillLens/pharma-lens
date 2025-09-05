import React, { useEffect, useState } from 'react';
import { NotificationPermissionDialog } from './NotificationPermissionDialog';
import { unifiedNotificationManager } from '@/services/unifiedNotificationManager';
import { useAuth } from '@/hooks/useAuth';
import { capacitorService } from '@/services/capacitorService';
import { supabase } from '@/integrations/supabase/client';

interface MobileNotificationSetupProps {
  onComplete?: () => void;
}

export const MobileNotificationSetup: React.FC<MobileNotificationSetupProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const isNative = capacitorService.isNative();
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  useEffect(() => {
    if (isNative) {
      checkFirstLaunch();
    }
  }, [isNative, user]);

  const checkFirstLaunch = async () => {
    try {
      let hasNotAsked = false;

      if (user) {
        // For authenticated users, check database
        const { data, error } = await supabase
          .from('profiles')
          .select('notification_permission_asked')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        hasNotAsked = !(data as any)?.notification_permission_asked;
      } else {
        // For unauthenticated users, check localStorage
        const asked = localStorage.getItem('notification_permission_asked');
        hasNotAsked = !asked;
      }

      setIsFirstLaunch(hasNotAsked);
      
      if (hasNotAsked) {
        // Initialize notification manager first
        await unifiedNotificationManager.initialize();
        setShowDialog(true);
      }
    } catch (error) {
      console.error('Error checking notification first launch:', error);
    }
  };

  const handleAllow = async () => {
    try {
      setLoading(true);

      console.log('[MOBILE-NOTIFICATION-SETUP] Starting notification setup...');
      
      // Initialize and request permission through unified manager
      await unifiedNotificationManager.initialize();
      const granted = await unifiedNotificationManager.requestPermission();
      
      console.log('[MOBILE-NOTIFICATION-SETUP] Permission granted:', granted);
      
      if (granted && user) {
        // Register user and schedule existing reminders
        const registered = await unifiedNotificationManager.registerUser(user.id);
        console.log('[MOBILE-NOTIFICATION-SETUP] User registered:', registered);
      }

      // Mark as asked
      if (user) {
        await supabase
          .from('profiles')
          .update({ notification_permission_asked: true } as any)
          .eq('id', user.id);
      } else {
        localStorage.setItem('notification_permission_asked', 'true');
      }

      setShowDialog(false);
      onComplete?.();
      
      if (granted) {
        console.log('[MOBILE-NOTIFICATION-SETUP] Setup completed successfully');
      }
      
    } catch (error) {
      console.error('Error enabling notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeny = async () => {
    try {
      // Mark as asked (even if denied)
      if (user) {
        await supabase
          .from('profiles')
          .update({ notification_permission_asked: true } as any)
          .eq('id', user.id);
      } else {
        localStorage.setItem('notification_permission_asked', 'true');
      }

      setShowDialog(false);
      onComplete?.();
    } catch (error) {
      console.error('Error handling notification denial:', error);
      setShowDialog(false);
    }
  };

  if (!isNative || !isFirstLaunch) {
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