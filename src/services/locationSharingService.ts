import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LocationData {
  id: string;
  user_id: string;
  family_group_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  is_emergency: boolean;
  expires_at?: string;
  created_at: string;
}

export interface LocationPermissions {
  enabled: boolean;
  shareWithFamily: boolean;
  emergencyOnly: boolean;
  duration: number; // in minutes
}

export class LocationSharingService {
  private watchId: number | null = null;
  private currentPermissions: LocationPermissions | null = null;

  async shareLocation(
    familyGroupId: string,
    isEmergency = false,
    duration = 60 // 1 hour default
  ): Promise<boolean> {
    try {
      const position = await this.getCurrentPosition();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + duration);

      // Get address from coordinates (reverse geocoding simulation)
      const address = await this.getAddressFromCoordinates(
        position.coords.latitude, 
        position.coords.longitude
      );

      const { error } = await supabase
        .from('location_sharing')
        .upsert({
          user_id: user.id,
          family_group_id: familyGroupId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          address,
          is_emergency: isEmergency,
          expires_at: expiresAt.toISOString()
        });

      if (error) throw error;

      // Notify family members
      if (isEmergency) {
        await this.notifyEmergencyLocation(familyGroupId, position, address);
      }

      toast.success(isEmergency ? 'Emergency location shared' : 'Location shared with family');
      return true;
    } catch (error) {
      console.error('Error sharing location:', error);
      toast.error('Failed to share location. Please check location permissions.');
      return false;
    }
  }

  async getFamilyLocations(familyGroupId: string): Promise<LocationData[]> {
    try {
      const { data, error } = await supabase
        .from('location_sharing')
        .select(`
          *,
          user:profiles!location_sharing_user_id_fkey(display_name, email, avatar_url)
        `)
        .eq('family_group_id', familyGroupId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching family locations:', error);
      return [];
    }
  }

  async stopSharingLocation(familyGroupId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('location_sharing')
        .update({ expires_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('family_group_id', familyGroupId);

      if (error) throw error;

      if (this.watchId) {
        navigator.geolocation.clearWatch(this.watchId);
        this.watchId = null;
      }

      toast.success('Location sharing stopped');
      return true;
    } catch (error) {
      console.error('Error stopping location sharing:', error);
      toast.error('Failed to stop location sharing');
      return false;
    }
  }

  async startContinuousSharing(familyGroupId: string, permissions: LocationPermissions): Promise<boolean> {
    try {
      this.currentPermissions = permissions;

      if (!permissions.enabled) {
        return this.stopSharingLocation(familyGroupId);
      }

      // Start watching position
      this.watchId = navigator.geolocation.watchPosition(
        async (position) => {
          if (permissions.shareWithFamily) {
            await this.updateLocationSilently(familyGroupId, position);
          }
        },
        (error) => {
          console.error('Location watch error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 60000 // 1 minute
        }
      );

      return true;
    } catch (error) {
      console.error('Error starting continuous location sharing:', error);
      return false;
    }
  }

  private async updateLocationSilently(familyGroupId: string, position: GeolocationPosition): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !this.currentPermissions) return;

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + this.currentPermissions.duration);

      await supabase
        .from('location_sharing')
        .upsert({
          user_id: user.id,
          family_group_id: familyGroupId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          is_emergency: false,
          expires_at: expiresAt.toISOString()
        });
    } catch (error) {
      console.error('Error updating location silently:', error);
    }
  }

  private async getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  private async getAddressFromCoordinates(lat: number, lng: number): Promise<string> {
    try {
      // In a real implementation, you would use a geocoding service
      // For now, return approximate coordinates
      return `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error('Error getting address:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }

  private async notifyEmergencyLocation(
    familyGroupId: string, 
    position: GeolocationPosition,
    address?: string
  ): Promise<void> {
    try {
      // Get family members
      const { data: members } = await supabase
        .from('family_members')
        .select('user_id')
        .eq('family_group_id', familyGroupId)
        .eq('invitation_status', 'accepted');

      if (!members) return;

      // Send emergency notifications
      for (const member of members) {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            user_id: member.user_id,
            title: '🚨 Emergency Location Alert',
            body: `Family member shared emergency location: ${address || 'Location available'}`,
            data: {
              type: 'emergency_location',
              family_group_id: familyGroupId,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              address
            },
            priority: 'high'
          }
        });
      }
    } catch (error) {
      console.error('Error sending emergency location notification:', error);
    }
  }

  async requestLocationPermission(): Promise<boolean> {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      
      if (result.state === 'granted') {
        return true;
      } else if (result.state === 'prompt') {
        // Try to get current position to trigger permission prompt
        await this.getCurrentPosition();
        return true;
      } else {
        toast.error('Location permission denied. Please enable location access in settings.');
        return false;
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      toast.error('Unable to access location. Please enable location services.');
      return false;
    }
  }

  cleanup(): void {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.currentPermissions = null;
  }
}

export const locationSharingService = new LocationSharingService();