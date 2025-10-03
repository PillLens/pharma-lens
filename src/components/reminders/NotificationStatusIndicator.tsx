import React, { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { capacitorService } from '@/services/capacitorService';
import { nativeNotificationManager } from '@/services/nativeNotificationManager';
import { LocalNotifications } from '@capacitor/local-notifications';
import { toast } from 'sonner';

interface NotificationStatusIndicatorProps {
  reminderId?: string;
  showTestButton?: boolean;
  compact?: boolean;
}

type NotificationStatus = 
  | 'enabled' 
  | 'disabled' 
  | 'permission-denied' 
  | 'not-supported'
  | 'loading';

const NotificationStatusIndicator: React.FC<NotificationStatusIndicatorProps> = ({
  reminderId,
  showTestButton = false,
  compact = false
}) => {
  const [status, setStatus] = useState<NotificationStatus>('loading');
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    setStatus('loading');

    try {
      if (!capacitorService.isNative()) {
        // Web environment - check browser notification permission
        if (!('Notification' in window)) {
          setStatus('not-supported');
          return;
        }

        if (Notification.permission === 'granted') {
          setStatus('enabled');
        } else if (Notification.permission === 'denied') {
          setStatus('permission-denied');
        } else {
          setStatus('disabled');
        }
        return;
      }

      // Native environment
      const hasPermission = await capacitorService.requestLocalNotificationPermissions();
      
      if (hasPermission) {
        const isInitialized = nativeNotificationManager.isServiceInitialized();
        setStatus(isInitialized ? 'enabled' : 'disabled');
      } else {
        setStatus('permission-denied');
      }
    } catch (error) {
      console.error('[NOTIFICATION-STATUS] Error checking status:', error);
      setStatus('disabled');
    }
  };

  const requestPermission = async () => {
    try {
      if (!capacitorService.isNative()) {
        // Web environment
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setStatus('enabled');
          toast.success('Notifications enabled');
        } else {
          setStatus('permission-denied');
          toast.error('Notification permission denied');
        }
        return;
      }

      // Native environment
      const granted = await capacitorService.requestLocalNotificationPermissions();
      
      if (granted) {
        await nativeNotificationManager.initialize();
        setStatus('enabled');
        toast.success('Notifications enabled');
      } else {
        setStatus('permission-denied');
        toast.error('Notification permission denied');
      }
    } catch (error) {
      console.error('[NOTIFICATION-STATUS] Error requesting permission:', error);
      toast.error('Failed to enable notifications');
    }
  };

  const testNotification = async () => {
    setIsTesting(true);

    try {
      if (!capacitorService.isNative()) {
        // Web notification test
        if (Notification.permission === 'granted') {
          new Notification('Test Reminder', {
            body: 'This is a test notification from PillLens',
            icon: '/pilllens-logo.png',
            badge: '/pilllens-logo.png'
          });
          toast.success('Test notification sent');
        } else {
          toast.error('Notification permission not granted');
        }
      } else {
        // Native notification test using LocalNotifications
        await LocalNotifications.schedule({
          notifications: [{
            id: Date.now(),
            title: 'Test Reminder',
            body: 'This is a test notification from PillLens',
            schedule: { at: new Date(Date.now() + 1000) }, // 1 second from now
            sound: 'default'
          }]
        });
        toast.success('Test notification scheduled');
      }
    } catch (error) {
      console.error('[NOTIFICATION-STATUS] Error testing notification:', error);
      toast.error('Failed to send test notification');
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'enabled':
        return {
          icon: <BellRing className="w-4 h-4" />,
          label: 'Notifications Active',
          variant: 'default' as const,
          color: 'text-success',
          bgColor: 'bg-success/10',
          description: 'You will receive reminders for this medication'
        };
      case 'disabled':
        return {
          icon: <BellOff className="w-4 h-4" />,
          label: 'Notifications Disabled',
          variant: 'secondary' as const,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          description: 'Enable notifications to receive reminders'
        };
      case 'permission-denied':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          label: 'Permission Denied',
          variant: 'destructive' as const,
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          description: 'Please enable notifications in your device settings'
        };
      case 'not-supported':
        return {
          icon: <BellOff className="w-4 h-4" />,
          label: 'Not Supported',
          variant: 'secondary' as const,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          description: 'Notifications are not supported in this browser'
        };
      case 'loading':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          label: 'Checking...',
          variant: 'outline' as const,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          description: 'Checking notification status'
        };
    }
  };

  const config = getStatusConfig();

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant={config.variant} 
              className={`${config.bgColor} ${config.color} cursor-pointer`}
              onClick={status === 'disabled' ? requestPermission : undefined}
            >
              {config.icon}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm font-medium">{config.label}</p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-xl border bg-card">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center ${config.color}`}>
          {config.icon}
        </div>
        <div>
          <div className="text-sm font-medium text-foreground">{config.label}</div>
          <div className="text-xs text-muted-foreground">{config.description}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {showTestButton && status === 'enabled' && (
          <Button
            size="sm"
            variant="outline"
            onClick={testNotification}
            disabled={isTesting}
            className="rounded-xl"
          >
            {isTesting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Bell className="w-4 h-4 mr-2" />
                Test
              </>
            )}
          </Button>
        )}

        {(status === 'disabled' || status === 'permission-denied') && (
          <Button
            size="sm"
            onClick={requestPermission}
            className="rounded-xl"
          >
            Enable
          </Button>
        )}

        {status === 'enabled' && (
          <CheckCircle2 className="w-5 h-5 text-success" />
        )}
      </div>
    </div>
  );
};

export default NotificationStatusIndicator;
