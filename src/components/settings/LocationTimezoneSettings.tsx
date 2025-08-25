import React, { useState } from 'react';
import { MapPin, Clock, Check, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TranslatedText } from '@/components/TranslatedText';
import { useLocationTimezone } from '@/hooks/useLocationTimezone';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from '@/hooks/use-toast';

export const LocationTimezoneSettings: React.FC = () => {
  const { t } = useTranslation();
  const { 
    timezoneData, 
    loading, 
    requestLocationPermission, 
    updateTimezone,
    commonTimezones 
  } = useLocationTimezone();
  
  const [updating, setUpdating] = useState(false);

  const handleLocationToggle = async (enabled: boolean) => {
    if (enabled) {
      setUpdating(true);
      try {
        const granted = await requestLocationPermission();
        if (granted) {
          toast({
            title: t('location.permissionGranted'),
            description: t('location.permissionGrantedDescription'),
          });
        }
      } catch (error) {
        toast({
          title: t('common.error'),
          description: t('location.permissionError'),
          variant: "destructive"
        });
      } finally {
        setUpdating(false);
      }
    }
  };

  const handleTimezoneChange = async (timezone: string) => {
    setUpdating(true);
    try {
      await updateTimezone(timezone);
      toast({
        title: t('location.timezoneUpdated'),
        description: t('location.timezoneUpdatedDescription'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('location.timezoneUpdateError'),
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card className="rounded-2xl shadow-md">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-8 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <TranslatedText translationKey="location.title" fallback="Location & Timezone" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-4">
        {/* Current Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                <TranslatedText translationKey="location.currentTimezone" fallback="Current Timezone" />
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {timezoneData?.timezone || 'UTC'}
            </div>
          </div>

          {timezoneData?.location?.city && timezoneData?.location?.country && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  <TranslatedText translationKey="location.currentLocation" fallback="Current Location" />
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {timezoneData.location.city}, {timezoneData.location.country}
              </div>
            </div>
          )}
        </div>

        {/* Location Permission */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">
                <TranslatedText translationKey="location.enableLocation" fallback="Enable Location Access" />
              </Label>
              <p className="text-xs text-muted-foreground">
                <TranslatedText 
                  translationKey="location.enableLocationDescription" 
                  fallback="Get accurate reminders and share location with family"
                />
              </p>
            </div>
            <div className="flex items-center gap-2">
              {timezoneData?.permissionGranted && (
                <Check className="w-4 h-4 text-green-500" />
              )}
              <Switch
                checked={timezoneData?.permissionGranted || false}
                onCheckedChange={handleLocationToggle}
                disabled={updating}
              />
            </div>
          </div>

          {!timezoneData?.permissionGranted && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLocationToggle(true)}
              disabled={updating}
              className="w-full"
            >
              {updating ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4 mr-2" />
              )}
              <TranslatedText translationKey="location.requestPermission" fallback="Request Location Permission" />
            </Button>
          )}
        </div>

        {/* Manual Timezone Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            <TranslatedText translationKey="location.manualTimezone" fallback="Manual Timezone Selection" />
          </Label>
          <Select
            value={timezoneData?.timezone || 'UTC'}
            onValueChange={handleTimezoneChange}
            disabled={updating}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {commonTimezones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{tz.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {tz.offset}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            <TranslatedText 
              translationKey="location.manualTimezoneDescription" 
              fallback="Override automatic timezone detection for medication reminders"
            />
          </p>
        </div>

        {/* Fallback Message */}
        {timezoneData?.permissionAsked && !timezoneData?.permissionGranted && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <TranslatedText 
                translationKey="location.fallbackMessage" 
                fallback="Using default UTC timezone. Enable location access for accurate local time reminders."
              />
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};