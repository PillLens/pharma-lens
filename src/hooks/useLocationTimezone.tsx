import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { locationTimezoneService, TimezoneData } from '@/services/locationTimezoneService';
import { useTranslation } from '@/hooks/useTranslation';

export const useLocationTimezone = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [timezoneData, setTimezoneData] = useState<TimezoneData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  useEffect(() => {
    if (user) {
      initializeTimezone();
    } else {
      setLoading(false);
    }
  }, [user]);

  const initializeTimezone = async () => {
    if (!user) return;

    try {
      const data = await locationTimezoneService.initializeLocationTimezone(user.id);
      setTimezoneData(data);
      
      // Check if this is first time asking for location
      if (!data.permissionAsked) {
        setIsFirstLaunch(true);
      }

      // Show fallback message if permission was denied
      if (data.permissionAsked && !data.permissionGranted) {
        locationTimezoneService.showLocationFallbackMessage(t);
      }
    } catch (error) {
      console.error('Error initializing timezone:', error);
      // Fallback to browser timezone
      const fallbackTimezone = locationTimezoneService.detectTimezone();
      setTimezoneData({
        timezone: fallbackTimezone,
        permissionGranted: false,
        permissionAsked: true
      });
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const result = await locationTimezoneService.requestLocationPermission();
      const timezone = locationTimezoneService.detectTimezone();
      
      const newData: TimezoneData = {
        timezone,
        location: result.location,
        permissionGranted: result.granted,
        permissionAsked: true
      };

      await locationTimezoneService.updateUserLocationTimezone(user.id, newData);
      setTimezoneData(newData);

      if (!result.granted) {
        locationTimezoneService.showLocationFallbackMessage(t);
      }

      return result.granted;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateTimezone = async (timezone: string) => {
    if (!user) return;

    try {
      await locationTimezoneService.setUserTimezone(user.id, timezone);
      setTimezoneData(prev => prev ? { ...prev, timezone } : null);
    } catch (error) {
      console.error('Error updating timezone:', error);
      throw error;
    }
  };

  return {
    timezoneData,
    loading,
    isFirstLaunch,
    requestLocationPermission,
    updateTimezone,
    commonTimezones: locationTimezoneService.getCommonTimezones()
  };
};