import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { MapPin, Users, Shield, Clock, AlertTriangle } from 'lucide-react';
import { locationSharingService } from '@/services/locationSharingService';

interface LocationSharingManagerProps {
  familyGroups: any[];
  currentUserId: string;
}

interface LocationData {
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
  user_name?: string;
}

export const LocationSharingManager: React.FC<LocationSharingManagerProps> = ({
  familyGroups,
  currentUserId
}) => {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [sharing, setSharing] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    checkLocationPermission();
    loadFamilyLocations();
  }, [familyGroups]);

  const checkLocationPermission = async () => {
    const hasPermission = await locationSharingService.requestLocationPermission();
    setPermissionGranted(hasPermission);
  };

  const loadFamilyLocations = async () => {
    if (!familyGroups.length) return;

    try {
      setLoading(true);
      const allLocations: LocationData[] = [];

      for (const group of familyGroups) {
        const groupLocations = await locationSharingService.getFamilyLocations(group.id);
        allLocations.push(...groupLocations);
      }

      setLocations(allLocations);
    } catch (error) {
      console.error('Error loading family locations:', error);
      toast.error('Failed to load location data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSharing = async (groupId: string) => {
    if (!permissionGranted) {
      const granted = await locationSharingService.requestLocationPermission();
      if (!granted) {
        toast.error('Location permission is required for sharing');
        return;
      }
      setPermissionGranted(true);
    }

    const isCurrentlySharing = sharing[groupId];

    try {
      if (isCurrentlySharing) {
        await locationSharingService.stopSharingLocation(groupId);
        setSharing(prev => ({ ...prev, [groupId]: false }));
        toast.success('Location sharing stopped');
      } else {
        const success = await locationSharingService.shareLocation(groupId, false, 8); // 8 hours
        if (success) {
          setSharing(prev => ({ ...prev, [groupId]: true }));
          toast.success('Location sharing started');
          loadFamilyLocations();
        }
      }
    } catch (error) {
      console.error('Error toggling location sharing:', error);
      toast.error('Failed to update location sharing');
    }
  };

  const handleEmergencyShare = async (groupId: string) => {
    if (!permissionGranted) {
      const granted = await locationSharingService.requestLocationPermission();
      if (!granted) {
        toast.error('Location permission is required for emergency sharing');
        return;
      }
    }

    try {
      const success = await locationSharingService.shareLocation(groupId, true, 2); // 2 hours for emergency
      if (success) {
        toast.success('Emergency location shared with family');
        loadFamilyLocations();
      }
    } catch (error) {
      console.error('Error sharing emergency location:', error);
      toast.error('Failed to share emergency location');
    }
  };

  const formatDistance = (lat1: number, lon1: number, lat2: number, lon2: number): string => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`;
    }
    return `${distance.toFixed(1)}km away`;
  };

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  if (!permissionGranted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Sharing
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Location Permission Required</h3>
          <p className="text-muted-foreground mb-4">
            Enable location access to share your location with family members during emergencies or for safety check-ins.
          </p>
          <Button onClick={checkLocationPermission}>
            Grant Location Permission
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Location Sharing Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Sharing Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {familyGroups.map((group) => (
            <div key={group.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{group.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {group.members?.length || 0} members
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEmergencyShare(group.id)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Emergency Share
                </Button>
                <div className="flex items-center gap-2">
                  <label className="text-sm">Auto-share</label>
                  <Switch
                    checked={sharing[group.id] || false}
                    onCheckedChange={() => handleToggleSharing(group.id)}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Family Locations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Family Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading locations...</p>
            </div>
          ) : locations.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Locations Shared</h3>
              <p className="text-muted-foreground">
                Family members haven't shared their locations yet. Enable auto-share or use emergency share when needed.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {locations.map((location) => (
                <div key={location.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      {location.is_emergency && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{location.user_name || 'Family Member'}</p>
                      <p className="text-sm text-muted-foreground">
                        {location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      {location.is_emergency && (
                        <Badge variant="destructive" className="text-xs">
                          Emergency
                        </Badge>
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {getTimeAgo(location.created_at)}
                      </div>
                    </div>
                     <p className="text-sm text-muted-foreground">
                       Accuracy: ±{Math.round(location.accuracy || 0)}m
                     </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};