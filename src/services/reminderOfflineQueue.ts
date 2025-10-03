import { supabase } from "@/integrations/supabase/client";

interface QueuedAction {
  id: string;
  type: 'mark_taken' | 'snooze' | 'toggle_status' | 'delete' | 'update';
  reminderId: string;
  data: any;
  timestamp: number;
  userId: string;
}

const QUEUE_KEY = 'reminder_offline_queue';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // 2 seconds

class ReminderOfflineQueue {
  private isProcessing = false;

  /**
   * Add an action to the offline queue
   */
  async queueAction(action: Omit<QueuedAction, 'id' | 'timestamp'>): Promise<void> {
    try {
      const queue = this.getQueue();
      const queuedAction: QueuedAction = {
        ...action,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      };
      
      queue.push(queuedAction);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      
      console.log('Action queued for offline sync:', queuedAction);
      
      // Try to process immediately if online
      if (navigator.onLine) {
        this.processQueue();
      }
    } catch (error) {
      console.error('Error queueing action:', error);
    }
  }

  /**
   * Get the current queue from localStorage
   */
  private getQueue(): QueuedAction[] {
    try {
      const queueData = localStorage.getItem(QUEUE_KEY);
      return queueData ? JSON.parse(queueData) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save queue to localStorage
   */
  private saveQueue(queue: QueuedAction[]): void {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }

  /**
   * Process all queued actions
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || !navigator.onLine) return;
    
    this.isProcessing = true;
    const queue = this.getQueue();
    
    if (queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    console.log(`Processing ${queue.length} queued actions...`);

    const remainingQueue: QueuedAction[] = [];
    
    for (const action of queue) {
      try {
        const success = await this.executeAction(action);
        
        if (!success) {
          // Keep failed actions in queue
          remainingQueue.push(action);
        }
      } catch (error) {
        console.error('Error processing queued action:', error);
        // Keep failed actions in queue
        remainingQueue.push(action);
      }
    }

    // Update queue with remaining failed actions
    this.saveQueue(remainingQueue);
    this.isProcessing = false;

    if (remainingQueue.length > 0) {
      console.log(`${remainingQueue.length} actions remain in queue, will retry later`);
      // Schedule retry
      setTimeout(() => this.processQueue(), RETRY_DELAY);
    } else {
      console.log('All queued actions processed successfully');
    }
  }

  /**
   * Execute a single queued action
   */
  private async executeAction(action: QueuedAction): Promise<boolean> {
    try {
      switch (action.type) {
        case 'mark_taken':
          return await this.executeMarkTaken(action);
        
        case 'toggle_status':
          return await this.executeToggleStatus(action);
        
        case 'delete':
          return await this.executeDelete(action);
        
        case 'update':
          return await this.executeUpdate(action);
        
        case 'snooze':
          return await this.executeSnooze(action);
        
        default:
          console.warn('Unknown action type:', action.type);
          return true; // Remove from queue
      }
    } catch (error) {
      console.error('Error executing action:', error);
      return false;
    }
  }

  private async executeMarkTaken(action: QueuedAction): Promise<boolean> {
    const { reminderId, medicationId, time } = action.data;
    
    const { error } = await supabase
      .from('medication_adherence_log')
      .insert({
        user_id: action.userId,
        medication_id: medicationId,
        scheduled_time: time,
        taken_time: new Date().toISOString(),
        status: 'taken'
      });

    return !error;
  }

  private async executeToggleStatus(action: QueuedAction): Promise<boolean> {
    const { isActive } = action.data;
    
    const { error } = await supabase
      .from('medication_reminders')
      .update({ is_active: isActive })
      .eq('id', action.reminderId)
      .eq('user_id', action.userId);

    return !error;
  }

  private async executeDelete(action: QueuedAction): Promise<boolean> {
    const { error } = await supabase
      .from('medication_reminders')
      .delete()
      .eq('id', action.reminderId)
      .eq('user_id', action.userId);

    return !error;
  }

  private async executeUpdate(action: QueuedAction): Promise<boolean> {
    const { error } = await supabase
      .from('medication_reminders')
      .update(action.data)
      .eq('id', action.reminderId)
      .eq('user_id', action.userId);

    return !error;
  }

  private async executeSnooze(action: QueuedAction): Promise<boolean> {
    // Implement snooze logic
    return true;
  }

  /**
   * Get queue size for UI display
   */
  getQueueSize(): number {
    return this.getQueue().length;
  }

  /**
   * Clear the entire queue (use with caution)
   */
  clearQueue(): void {
    localStorage.removeItem(QUEUE_KEY);
  }

  /**
   * Initialize online/offline listeners
   */
  initialize(): void {
    // Process queue when coming back online
    window.addEventListener('online', () => {
      console.log('Device is online, processing queued actions...');
      this.processQueue();
    });

    // Log when going offline
    window.addEventListener('offline', () => {
      console.log('Device is offline, actions will be queued');
    });

    // Try to process any existing queue on initialization
    if (navigator.onLine) {
      this.processQueue();
    }
  }
}

export const reminderOfflineQueue = new ReminderOfflineQueue();
