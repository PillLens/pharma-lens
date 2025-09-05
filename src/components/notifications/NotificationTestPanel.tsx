import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { capacitorService } from '@/services/capacitorService';
import { nativeNotificationManager } from '@/services/nativeNotificationManager';
import { unifiedNotificationManager } from '@/services/unifiedNotificationManager';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useAuth } from '@/hooks/useAuth';
import { Bell, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface NotificationStatus {
  pushPermissions: boolean | null;
  localPermissions: boolean | null;
  managerInitialized: boolean;
  isNative: boolean;
}

export const NotificationTestPanel: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<NotificationStatus>({
    pushPermissions: null,
    localPermissions: null,
    managerInitialized: false,
    isNative: false
  });
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    try {
      const isNative = capacitorService.isNative();
      let pushPermissions = null;
      let localPermissions = null;

      if (isNative) {
        pushPermissions = await capacitorService.checkPushPermissions();
        localPermissions = await capacitorService.checkLocalNotificationPermissions();
      }

      const managerInitialized = nativeNotificationManager.isServiceInitialized();

      setStatus({
        pushPermissions,
        localPermissions,
        managerInitialized,
        isNative
      });
    } catch (error) {
      console.error('Error checking notification status:', error);
      toast.error('Failed to check notification status');
    }
  };

  const requestPermissions = async () => {
    try {
      setTesting(true);
      toast.info('Requesting notification permissions...');

      const success = await unifiedNotificationManager.requestPermission();
      
      if (success) {
        toast.success('Notification permissions granted!');
      } else {
        toast.error('Failed to get notification permissions');
      }

      // Refresh status
      await checkNotificationStatus();
    } catch (error) {
      console.error('Error requesting permissions:', error);
      toast.error('Failed to request permissions');
    } finally {
      setTesting(false);
    }
  };

  const testLocalNotification = async () => {
    try {
      setTesting(true);
      toast.info('Sending test local notification...');

      await LocalNotifications.schedule({
        notifications: [{
          id: Date.now(),
          title: '🧪 Test Local Notification',
          body: 'This is a test local notification from PillLens',
          schedule: { at: new Date(Date.now() + 2000) }, // 2 seconds from now
          sound: 'default',
          extra: {
            test: true
          }
        }]
      });

      toast.success('Test local notification scheduled for 2 seconds from now');
    } catch (error) {
      console.error('Error sending test local notification:', error);
      toast.error('Failed to send test local notification');
    } finally {
      setTesting(false);
    }
  };

  const testPushNotification = async () => {
    if (!user) {
      toast.error('Please log in to test push notifications');
      return;
    }

    try {
      setTesting(true);
      toast.info('Sending test push notification...');

      const success = await unifiedNotificationManager.sendTestNotification();
      
      if (success) {
        toast.success('Test push notification sent!');
      } else {
        toast.error('Failed to send test push notification');
      }
    } catch (error) {
      console.error('Error sending test push notification:', error);
      toast.error('Failed to send test push notification');
    } finally {
      setTesting(false);
    }
  };

  const testMedicationReminder = async () => {
    try {
      setTesting(true);
      toast.info('Testing medication reminder notification...');

      // Schedule a test medication reminder for 3 seconds from now
      const testTime = new Date(Date.now() + 3000);
      const timeString = testTime.toTimeString().slice(0, 5);

      await LocalNotifications.schedule({
        notifications: [{
          id: Date.now(),
          title: '💊 Test Medication Reminder',
          body: 'Time to take Test Medication (500mg)',
          schedule: { at: testTime },
          sound: 'default',
          extra: {
            medicationId: 'test-med-id',
            reminderTime: timeString,
            medicationName: 'Test Medication',
            dosage: '500mg',
            test: true
          }
        }]
      });

      toast.success('Test medication reminder scheduled for 3 seconds from now');
    } catch (error) {
      console.error('Error sending test medication reminder:', error);
      toast.error('Failed to send test medication reminder');
    } finally {
      setTesting(false);
    }
  };

  const initializeNotificationManager = async () => {
    try {
      setTesting(true);
      toast.info('Initializing notification manager...');

      const success = await unifiedNotificationManager.initialize();
      
      if (success) {
        toast.success('Notification manager initialized successfully!');
      } else {
        toast.error('Failed to initialize notification manager');
      }

      await checkNotificationStatus();
    } catch (error) {
      console.error('Error initializing notification manager:', error);
      toast.error('Failed to initialize notification manager');
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    return status ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (status: boolean | null, trueText: string, falseText: string, nullText: string = 'Unknown') => {
    if (status === null) return <Badge variant="secondary">{nullText}</Badge>;
    return status ? 
      <Badge variant="default" className="bg-green-500">{trueText}</Badge> : 
      <Badge variant="destructive">{falseText}</Badge>;
  };

  if (!status.isNative) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Notification testing is only available on native mobile apps. 
            You're currently using the web version.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification System Test Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Section */}
        <div className="space-y-3">
          <h3 className="font-semibold">System Status</h3>
          
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(status.pushPermissions)}
              <span>Push Notifications</span>
            </div>
            {getStatusBadge(status.pushPermissions, 'Enabled', 'Disabled', 'Not Checked')}
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(status.localPermissions)}
              <span>Local Notifications</span>
            </div>
            {getStatusBadge(status.localPermissions, 'Enabled', 'Disabled', 'Not Checked')}
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(status.managerInitialized)}
              <span>Notification Manager</span>
            </div>
            {getStatusBadge(status.managerInitialized, 'Initialized', 'Not Initialized')}
          </div>
        </div>

        {/* Actions Section */}
        <div className="space-y-3">
          <h3 className="font-semibold">Actions</h3>
          
          <div className="grid grid-cols-1 gap-2">
            <Button 
              variant="outline" 
              onClick={checkNotificationStatus}
              disabled={testing}
            >
              Refresh Status
            </Button>
            
            {!status.managerInitialized && (
              <Button 
                onClick={initializeNotificationManager}
                disabled={testing}
              >
                Initialize Notification Manager
              </Button>
            )}
            
            {(!status.pushPermissions || !status.localPermissions) && (
              <Button 
                onClick={requestPermissions}
                disabled={testing}
              >
                Request Permissions
              </Button>
            )}
          </div>
        </div>

        {/* Testing Section */}
        {status.localPermissions && (
          <div className="space-y-3">
            <h3 className="font-semibold">Test Notifications</h3>
            
            <div className="grid grid-cols-1 gap-2">
              <Button 
                variant="outline" 
                onClick={testLocalNotification}
                disabled={testing}
              >
                Test Local Notification
              </Button>
              
              <Button 
                variant="outline" 
                onClick={testMedicationReminder}
                disabled={testing}
              >
                Test Medication Reminder
              </Button>
              
              {status.pushPermissions && user && (
                <Button 
                  variant="outline" 
                  onClick={testPushNotification}
                  disabled={testing}
                >
                  Test Push Notification
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>Local Notifications:</strong> Essential for medication reminders. These work offline.</p>
          <p><strong>Push Notifications:</strong> Used for family alerts and missed dose notifications from caregivers.</p>
          <p><strong>Testing:</strong> Use the test buttons to verify notifications are working correctly on your device.</p>
        </div>
      </CardContent>
    </Card>
  );
};