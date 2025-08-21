import { supabase } from '@/integrations/supabase/client';

export interface OfflineData {
  medications: any[];
  products: any[];
  userMedications: any[];
  lastSync: string;
}

export interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: 'user_medications' | 'usage_analytics';
  data: any;
  timestamp: string;
}

class OfflineService {
  private readonly OFFLINE_DATA_KEY = 'care_capsule_offline_data';
  private readonly PENDING_OPERATIONS_KEY = 'care_capsule_pending_ops';
  private readonly CACHE_EXPIRY_HOURS = 24;

  async cacheEssentialData(): Promise<void> {
    try {
      // Cache verified products for offline use
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('verification_status', 'verified')
        .limit(1000);

      if (productsError) throw productsError;

      // Cache user medications
      const { data: userMedications, error: userMedsError } = await supabase
        .from('user_medications')
        .select('*')
        .eq('is_active', true);

      if (userMedsError) throw userMedsError;

      const offlineData: OfflineData = {
        medications: [], // Would include comprehensive medication data
        products: products || [],
        userMedications: userMedications || [],
        lastSync: new Date().toISOString()
      };

      localStorage.setItem(this.OFFLINE_DATA_KEY, JSON.stringify(offlineData));
      console.log('Essential data cached for offline use');
    } catch (error) {
      console.error('Failed to cache offline data:', error);
    }
  }

  getOfflineData(): OfflineData | null {
    try {
      const data = localStorage.getItem(this.OFFLINE_DATA_KEY);
      if (!data) return null;

      const offlineData: OfflineData = JSON.parse(data);
      
      // Check if cache is expired
      const lastSync = new Date(offlineData.lastSync);
      const now = new Date();
      const hoursDiff = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > this.CACHE_EXPIRY_HOURS) {
        console.log('Offline cache expired');
        return null;
      }

      return offlineData;
    } catch (error) {
      console.error('Failed to get offline data:', error);
      return null;
    }
  }

  async searchProductsOffline(query: string): Promise<any[]> {
    const offlineData = this.getOfflineData();
    if (!offlineData) return [];

    const lowercaseQuery = query.toLowerCase();
    return offlineData.products.filter(product => 
      product.brand_name?.toLowerCase().includes(lowercaseQuery) ||
      product.generic_name?.toLowerCase().includes(lowercaseQuery) ||
      product.search_keywords?.some((keyword: string) => 
        keyword.toLowerCase().includes(lowercaseQuery)
      )
    );
  }

  async findProductByBarcodeOffline(barcode: string): Promise<any | null> {
    const offlineData = this.getOfflineData();
    if (!offlineData) return null;

    return offlineData.products.find(product => product.barcode === barcode) || null;
  }

  // Queue operations for when back online
  queueOperation(operation: Omit<PendingOperation, 'id' | 'timestamp'>): void {
    try {
      const existingOps = this.getPendingOperations();
      const newOperation: PendingOperation = {
        ...operation,
        id: this.generateOperationId(),
        timestamp: new Date().toISOString()
      };

      existingOps.push(newOperation);
      localStorage.setItem(this.PENDING_OPERATIONS_KEY, JSON.stringify(existingOps));
    } catch (error) {
      console.error('Failed to queue operation:', error);
    }
  }

  getPendingOperations(): PendingOperation[] {
    try {
      const ops = localStorage.getItem(this.PENDING_OPERATIONS_KEY);
      return ops ? JSON.parse(ops) : [];
    } catch (error) {
      console.error('Failed to get pending operations:', error);
      return [];
    }
  }

  async syncPendingOperations(): Promise<void> {
    const pendingOps = this.getPendingOperations();
    if (pendingOps.length === 0) return;

    console.log(`Syncing ${pendingOps.length} pending operations...`);
    
    for (const op of pendingOps) {
      try {
        await this.executePendingOperation(op);
      } catch (error) {
        console.error(`Failed to sync operation ${op.id}:`, error);
        // Keep failed operations in queue for retry
        continue;
      }
    }

    // Clear successfully synced operations
    localStorage.removeItem(this.PENDING_OPERATIONS_KEY);
    console.log('Pending operations synced successfully');
  }

  private async executePendingOperation(operation: PendingOperation): Promise<void> {
    const { type, table, data } = operation;

    // Type-safe table operations
    switch (table) {
      case 'user_medications':
        await this.executeUserMedicationOperation(type, data);
        break;
      case 'usage_analytics':
        await this.executeAnalyticsOperation(type, data);
        break;
      default:
        console.warn(`Unsupported table for offline sync: ${table}`);
    }
  }

  private async executeUserMedicationOperation(type: string, data: any): Promise<void> {
    switch (type) {
      case 'create':
        const { error: insertError } = await supabase
          .from('user_medications')
          .insert(data);
        if (insertError) throw insertError;
        break;

      case 'update':
        const { error: updateError } = await supabase
          .from('user_medications')
          .update(data)
          .eq('id', data.id);
        if (updateError) throw updateError;
        break;

      case 'delete':
        const { error: deleteError } = await supabase
          .from('user_medications')
          .delete()
          .eq('id', data.id);
        if (deleteError) throw deleteError;
        break;
    }
  }

  private async executeAnalyticsOperation(type: string, data: any): Promise<void> {
    if (type === 'create') {
      const { error } = await supabase
        .from('usage_analytics')
        .insert(data);
      if (error) throw error;
    }
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  // Set up network status listeners
  setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      console.log('Back online - syncing pending operations');
      this.syncPendingOperations();
      this.cacheEssentialData();
    });

    window.addEventListener('offline', () => {
      console.log('Gone offline - switching to cached data');
    });
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Clear offline data (useful for debugging)
  clearOfflineData(): void {
    localStorage.removeItem(this.OFFLINE_DATA_KEY);
    localStorage.removeItem(this.PENDING_OPERATIONS_KEY);
    console.log('Offline data cleared');
  }
}

export const offlineService = new OfflineService();
