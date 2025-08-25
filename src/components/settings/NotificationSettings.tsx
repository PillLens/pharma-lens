import React, { useState, useEffect } from 'react';
import { Bell, Clock, Send, Check, Pill } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { TranslatedText } from '@/components/TranslatedText';
import { useTranslation } from '@/hooks/useTranslation';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from '@/hooks/use-toast';

interface NotificationSettingsProps {
  className?: string;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ className }) => {
  const { t } = useTranslation();
  const { 
    preferences, 
    loading, 
    updatePreferences, 
    sendTestNotification,
    isOneSignalReady 
  } = usePushNotifications();
  
  const [testingSent, setTestingSent] = useState(false);

  const handleToggleChange = async (key: keyof typeof preferences, value: boolean) => {
    try {
      await updatePreferences({ [key]: value });
      toast({
        title: t('common.success'),
        description: t('settings.notifications.updated'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('settings.notifications.updateError'),
        variant: 'destructive',
      });
    }
  };

  const handleQuietHoursChange = async (field: 'start' | 'end', value: string) => {
    try {
      await updatePreferences({
        quietHours: {
          ...preferences.quietHours,
          [field]: value
        }
      });
      toast({
        title: t('common.success'),
        description: t('settings.notifications.quietHoursUpdated'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('settings.notifications.updateError'),
        variant: 'destructive',
      });
    }
  };

  const handleSendTestNotification = async () => {
    setTestingSent(true);
    try {
      const success = await sendTestNotification();
      if (success) {
        toast({
          title: t('common.success'),
          description: t('settings.notifications.testSent'),
        });
      } else {
        toast({
          title: t('common.error'),
          description: t('settings.notifications.testFailed'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('settings.notifications.testFailed'),
        variant: 'destructive',
      });
    } finally {
      setTimeout(() => setTestingSent(false), 2000);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <TranslatedText translationKey="settings.notifications.title" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <TranslatedText translationKey="settings.notifications.title" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-base font-medium">
              <TranslatedText translationKey="settings.notifications.masterToggle" />
            </Label>
            <p className="text-sm text-muted-foreground">
              <TranslatedText translationKey="settings.notifications.masterDescription" />
            </p>
          </div>
          <Switch
            checked={preferences.enabled}
            onCheckedChange={(value) => handleToggleChange('enabled', value)}
            disabled={loading || !isOneSignalReady}
          />
        </div>

        <Separator />

        {/* Individual notification types */}
        <div className="space-y-4">
          {/* Medication Reminders */}
          <div className="flex items-start gap-3">
            <Pill className="h-5 w-5 mt-0.5 text-primary" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="font-medium">
                    <TranslatedText translationKey="settings.notifications.reminders" />
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    <TranslatedText translationKey="settings.notifications.remindersDescription" />
                  </p>
                </div>
                <Switch
                  checked={preferences.reminders}
                  onCheckedChange={(value) => handleToggleChange('reminders', value)}
                  disabled={loading || !preferences.enabled}
                />
              </div>
            </div>
          </div>

          {/* Missed Dose Alerts */}
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 mt-0.5 text-orange-500" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="font-medium">
                    <TranslatedText translationKey="settings.notifications.missedDose" />
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    <TranslatedText translationKey="settings.notifications.missedDoseDescription" />
                  </p>
                </div>
                <Switch
                  checked={preferences.missedDose}
                  onCheckedChange={(value) => handleToggleChange('missedDose', value)}
                  disabled={loading || !preferences.enabled}
                />
              </div>
            </div>
          </div>

          {/* Family Updates */}
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 mt-0.5 text-blue-500" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="font-medium">
                    <TranslatedText translationKey="settings.notifications.family" />
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    <TranslatedText translationKey="settings.notifications.familyDescription" />
                  </p>
                </div>
                <Switch
                  checked={preferences.family}
                  onCheckedChange={(value) => handleToggleChange('family', value)}
                  disabled={loading || !preferences.enabled}
                />
              </div>
            </div>
          </div>

          {/* Product Alerts */}
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 mt-0.5 text-red-500">⚠️</div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="font-medium">
                    <TranslatedText translationKey="settings.notifications.product" />
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    <TranslatedText translationKey="settings.notifications.productDescription" />
                  </p>
                </div>
                <Switch
                  checked={preferences.product}
                  onCheckedChange={(value) => handleToggleChange('product', value)}
                  disabled={loading || !preferences.enabled}
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Quiet Hours */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <Label className="text-base font-medium">
              <TranslatedText translationKey="settings.notifications.quietHours" />
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            <TranslatedText translationKey="settings.notifications.quietHoursDescription" />
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">
                <TranslatedText translationKey="settings.notifications.from" />
              </Label>
              <Input
                type="time"
                value={preferences.quietHours.start}
                onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                disabled={loading || !preferences.enabled}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">
                <TranslatedText translationKey="settings.notifications.to" />
              </Label>
              <Input
                type="time"
                value={preferences.quietHours.end}
                onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                disabled={loading || !preferences.enabled}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Test Notification */}
        <div className="space-y-2">
          <Button
            variant="outline"
            onClick={handleSendTestNotification}
            disabled={loading || !preferences.enabled || !isOneSignalReady || testingSent}
            className="w-full"
          >
            {testingSent ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                <TranslatedText translationKey="settings.notifications.testSent" />
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                <TranslatedText translationKey="settings.notifications.testNotification" />
              </>
            )}
          </Button>
          {!isOneSignalReady && (
            <p className="text-xs text-muted-foreground text-center">
              <TranslatedText translationKey="settings.notifications.notificationsNotReady" />
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};