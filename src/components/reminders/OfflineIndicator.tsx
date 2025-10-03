import { useEffect, useState } from 'react';
import { WifiOff, Wifi, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { reminderOfflineQueue } from '@/services/reminderOfflineQueue';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      updateQueueSize();
    };

    const updateQueueSize = () => {
      setQueueSize(reminderOfflineQueue.getQueueSize());
    };

    // Update immediately
    updateQueueSize();

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Poll queue size periodically
    const interval = setInterval(updateQueueSize, 2000);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  // Don't show anything if online and no queue
  if (isOnline && queueSize === 0) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 h-8"
        >
          {isOnline ? (
            <Wifi className="h-4 w-4 text-success" />
          ) : (
            <WifiOff className="h-4 w-4 text-warning animate-pulse" />
          )}
          {queueSize > 0 && (
            <Badge variant="secondary" className="h-5 px-2 text-xs">
              {queueSize}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                <Wifi className="h-5 w-5 text-success" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                <WifiOff className="h-5 w-5 text-warning" />
              </div>
            )}
            <div className="flex-1">
              <h4 className="font-semibold text-sm">
                {isOnline ? 'Connected' : 'Offline Mode'}
              </h4>
              <p className="text-xs text-muted-foreground">
                {isOnline
                  ? 'All changes are being saved'
                  : 'Changes will sync when online'}
              </p>
            </div>
          </div>

          {queueSize > 0 && (
            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {queueSize} {queueSize === 1 ? 'action' : 'actions'} pending
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {isOnline
                  ? 'Syncing your changes now...'
                  : 'These will be synced when you\'re back online'}
              </p>
            </div>
          )}

          {isOnline && queueSize > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                reminderOfflineQueue.processQueue();
              }}
              className="w-full"
            >
              Retry Sync Now
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};