import { useState, useEffect } from 'react';
import { offlineService } from '@/services/offlineService';
import { toast } from 'sonner';

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOperations, setPendingOperations] = useState(0);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online - syncing data...');
      syncPendingOperations();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.info('Gone offline - using cached data');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initialize offline service
    offlineService.setupNetworkListeners();
    
    // Update pending operations count
    updatePendingOperationsCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncPendingOperations = async () => {
    try {
      await offlineService.syncPendingOperations();
      await offlineService.cacheEssentialData();
      updatePendingOperationsCount();
      toast.success('Data synced successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Failed to sync data');
    }
  };

  const updatePendingOperationsCount = () => {
    const pending = offlineService.getPendingOperations();
    setPendingOperations(pending.length);
  };

  const queueOperation = (operation: {
    type: 'create' | 'update' | 'delete';
    table: 'user_medications' | 'usage_analytics';
    data: any;
  }) => {
    offlineService.queueOperation(operation);
    updatePendingOperationsCount();
    
    if (!isOnline) {
      toast.info('Operation queued for when back online');
    }
  };

  const cacheData = async () => {
    try {
      await offlineService.cacheEssentialData();
      toast.success('Data cached for offline use');
    } catch (error) {
      console.error('Caching failed:', error);
      toast.error('Failed to cache data');
    }
  };

  return {
    isOnline,
    pendingOperations,
    queueOperation,
    syncPendingOperations,
    cacheData,
    offlineService
  };
};