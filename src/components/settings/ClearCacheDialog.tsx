import { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { cacheService } from '@/services/cacheService';
import { toast } from 'sonner';

interface ClearCacheDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ClearCacheDialog({ open, onClose }: ClearCacheDialogProps) {
  const [clearing, setClearing] = useState(false);
  const [cacheSize, setCacheSize] = useState<string>('');

  useEffect(() => {
    if (open) {
      loadCacheSize();
    }
  }, [open]);

  const loadCacheSize = async () => {
    const size = await cacheService.getCacheSize();
    setCacheSize(cacheService.formatBytes(size));
  };

  const handleClearCache = async () => {
    setClearing(true);
    try {
      await cacheService.clearAllCaches();
      toast.success('Cache cleared successfully');
      
      // Reload the page after a short delay to ensure changes take effect
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error('Failed to clear cache');
      setClearing(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear Cache</AlertDialogTitle>
          <AlertDialogDescription>
            This will clear all cached data including offline data and settings.
            {cacheSize && (
              <span className="block mt-2 font-medium">
                Current cache size: {cacheSize}
              </span>
            )}
            <span className="block mt-2 text-destructive">
              The app will reload after clearing the cache.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={clearing}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleClearCache} disabled={clearing}>
            {clearing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Clear Cache
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
