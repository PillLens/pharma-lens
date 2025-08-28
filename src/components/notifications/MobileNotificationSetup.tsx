import React, { useEffect, useState } from 'react';
import { NotificationPermissionDialog } from './NotificationPermissionDialog';
import { unifiedNotificationManager } from '@/services/unifiedNotificationManager';
import { useAuth } from '@/hooks/useAuth';
import { useIsNativeMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

interface MobileNotificationSetupProps {
  onComplete?: () => void;
}

export const MobileNotificationSetup: React.FC<MobileNotificationSetupProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const isNative = useIsNativeMobile();
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
          .eq('id' as any, user.id as any)
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

      // Request permission through unified manager
      const granted = await unifiedNotificationManager.requestPermission();
      
      if (granted && user) {
        // Register user if authenticated
        await unifiedNotificationManager.registerUser(user.id);
      }

      // Mark as asked
      if (user) {
        await supabase
          .from('profiles')
          .update({ notification_permission_asked: true } as any)
          .eq('id' as any, user.id as any);
      } else {
        localStorage.setItem('notification_permission_asked', 'true');
      }

      setShowDialog(false);
      onComplete?.();
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
          .eq('id' as any, user.id as any);
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