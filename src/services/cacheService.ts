import { supabase } from '@/integrations/supabase/client';

/**
 * Service for managing application cache
 */
class CacheService {
  /**
   * Clear all localStorage data except auth tokens
   */
  clearLocalStorage(): void {
    const keysToPreserve = [
      'supabase.auth.token',
      'sb-bquxkkaipevuakmqqilk-auth-token'
    ];

    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (!keysToPreserve.some(preserved => key.includes(preserved))) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Clear IndexedDB databases
   */
  async clearIndexedDB(): Promise<void> {
    if (!window.indexedDB) return;

    try {
      const databases = await window.indexedDB.databases();
      for (const db of databases) {
        if (db.name) {
          window.indexedDB.deleteDatabase(db.name);
        }
      }
    } catch (error) {
      console.error('Error clearing IndexedDB:', error);
    }
  }

  /**
   * Clear session storage
   */
  clearSessionStorage(): void {
    sessionStorage.clear();
  }

  /**
   * Clear all caches
   */
  async clearAllCaches(): Promise<void> {
    try {
      // Clear localStorage
      this.clearLocalStorage();

      // Clear sessionStorage
      this.clearSessionStorage();

      // Clear IndexedDB
      await this.clearIndexedDB();

      // Clear Cache API if available
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      // Log activity
      await supabase.rpc('log_activity', {
        p_activity_type: 'cache_cleared',
        p_activity_data: {}
      });

      console.log('All caches cleared successfully');
    } catch (error) {
      console.error('Error clearing caches:', error);
      throw error;
    }
  }

  /**
   * Get estimated cache size
   */
  async getCacheSize(): Promise<number> {
    if (!navigator.storage || !navigator.storage.estimate) {
      return 0;
    }

    try {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    } catch (error) {
      console.error('Error estimating cache size:', error);
      return 0;
    }
  }

  /**
   * Format bytes to human readable string
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

export const cacheService = new CacheService();
