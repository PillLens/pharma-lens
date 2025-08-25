import React, { useEffect, useState } from 'react';
import { LocationPermissionDialog } from './LocationPermissionDialog';
import { FirstLaunchNotificationSetup } from '../notifications/FirstLaunchNotificationSetup';
import { useLocationTimezone } from '@/hooks/useLocationTimezone';
import { useAuth } from '@/hooks/useAuth';

export const FirstLaunchLocationSetup: React.FC = () => {
  const { user } = useAuth();
  const { timezoneData, loading, isFirstLaunch, requestLocationPermission } = useLocationTimezone();
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    // Show location permission dialog on first launch
    if (user && !loading && isFirstLaunch) {
      setShowDialog(true);
    }
  }, [user, loading, isFirstLaunch]);

  const handleAllow = async () => {
    await requestLocationPermission();
    setShowDialog(false);
  };

  const handleDeny = () => {
    setShowDialog(false);
  };

  if (!user || loading || !isFirstLaunch) {
    return null;
  }

  return (
    <>
      <LocationPermissionDialog
        isOpen={showDialog}
        onAllow={handleAllow}
        onDeny={handleDeny}
        loading={false}
      />
      <FirstLaunchNotificationSetup />
    </>
  );
};