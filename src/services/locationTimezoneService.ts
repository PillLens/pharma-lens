import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface LocationData {
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface TimezoneData {
  timezone: string;
  location?: LocationData;
  permissionGranted: boolean;
  permissionAsked: boolean;
}

class LocationTimezoneService {
  /**
   * Detect user's timezone automatically
   */
  detectTimezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'UTC';
    }
  }

  /**
   * Request location permission and get coordinates
   */
  async requestLocationPermission(): Promise<{ granted: boolean; location?: LocationData }> {
    if (!navigator.geolocation) {
      return { granted: false };
    }

    return new Promise((resolve) => {
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Try to get city/country from reverse geocoding
            const location = await this.reverseGeocode(latitude, longitude);
            resolve({ 
              granted: true, 
              location: { 
                ...location, 
                latitude, 
                longitude 
              } 
            });
          } catch {
            resolve({ 
              granted: true, 
              location: { latitude, longitude } 
            });
          }
        },
        () => {
          resolve({ granted: false });
        },
        options
      );
    });
  }

  /**
   * Reverse geocode coordinates to get city/country
   */
  private async reverseGeocode(lat: number, lng: number): Promise<{ city?: string; country?: string }> {
    try {
      // Using OpenStreetMap Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'PharmaLens/1.0'
          }
        }
      );

      if (!response.ok) throw new Error('Geocoding failed');

      const data = await response.json();
      const address = data.address || {};

      return {
        city: address.city || address.town || address.village || address.municipality,
        country: address.country
      };
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      return {};
    }
  }

  /**
   * Initialize location and timezone on first app launch
   */
  async initializeLocationTimezone(userId: string): Promise<TimezoneData> {
    const timezone = this.detectTimezone();
    
    // Check if we've already asked for location permission
    const { data: profile } = await supabase
      .from('profiles')
      .select('location_permission_asked, location_permission_granted, timezone, city, country')
      .eq('id', userId)
      .single();

    if (profile?.location_permission_asked) {
      return {
        timezone: profile.timezone || timezone,
        location: profile.city && profile.country ? {
          city: profile.city,
          country: profile.country
        } : undefined,
        permissionGranted: profile.location_permission_granted || false,
        permissionAsked: true
      };
    }

    // First time - ask for location permission
    const locationResult = await this.requestLocationPermission();
    
    // Update profile with timezone and location permission status
    await this.updateUserLocationTimezone(userId, {
      timezone,
      location: locationResult.location,
      permissionGranted: locationResult.granted,
      permissionAsked: true
    });

    return {
      timezone,
      location: locationResult.location,
      permissionGranted: locationResult.granted,
      permissionAsked: true
    };
  }

  /**
   * Update user's location and timezone in profile
   */
  async updateUserLocationTimezone(userId: string, data: TimezoneData): Promise<void> {
    const updateData: any = {
      timezone: data.timezone,
      location_permission_asked: data.permissionAsked,
      location_permission_granted: data.permissionGranted
    };

    if (data.location?.city) updateData.city = data.location.city;
    if (data.location?.country) updateData.country = data.location.country;

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      console.error('Error updating location/timezone:', error);
      throw error;
    }
  }

  /**
   * Get user's current timezone from profile
   */
  async getUserTimezone(userId: string): Promise<string> {
    const { data } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', userId)
      .single();

    return data?.timezone || this.detectTimezone();
  }

  /**
   * Manually set timezone (for settings)
   */
  async setUserTimezone(userId: string, timezone: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ timezone })
      .eq('id', userId);

    if (error) {
      console.error('Error setting timezone:', error);
      throw error;
    }
  }

  /**
   * Check if location permission was denied and show helpful message
   */
  showLocationFallbackMessage(t: (key: string) => string): void {
    toast({
      title: t('location.permissionDenied'),
      description: t('location.fallbackMessage'),
      variant: "default"
    });
  }

  /**
   * Get common timezones for manual selection
   */
  getCommonTimezones(): Array<{ value: string; label: string; offset: string }> {
    const now = new Date();
    const timezones = [
      'UTC',
      'America/New_York',
      'America/Chicago', 
      'America/Denver',
      'America/Los_Angeles',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Europe/Istanbul',
      'Europe/Moscow',
      'Asia/Dubai',
      'Asia/Karachi',
      'Asia/Dhaka',
      'Asia/Bangkok',
      'Asia/Shanghai',
      'Asia/Tokyo',
      'Asia/Baku',
      'Australia/Sydney'
    ];

    return timezones.map(tz => {
      const formatter = new Intl.DateTimeFormat('en', {
        timeZone: tz,
        timeZoneName: 'short'
      });
      
      const parts = formatter.formatToParts(now);
      const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value || '';
      
      // Calculate offset
      const utcDate = new Date(now.toISOString());
      const tzDate = new Date(now.toLocaleString('en-US', { timeZone: tz }));
      const offset = (utcDate.getTime() - tzDate.getTime()) / (1000 * 60 * 60);
      const offsetStr = offset === 0 ? 'UTC' : `UTC${offset > 0 ? '-' : '+'}${Math.abs(offset)}`;

      return {
        value: tz,
        label: tz.replace('_', ' '),
        offset: offsetStr
      };
    });
  }
}

export const locationTimezoneService = new LocationTimezoneService();