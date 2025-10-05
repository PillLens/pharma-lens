import { supabase } from '@/integrations/supabase/client';

export interface ActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  activity_data: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

class ActivityLogService {
  /**
   * Get user's activity log
   */
  async getActivityLog(limit: number = 50): Promise<ActivityLog[]> {
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching activity log:', error);
      return [];
    }
  }

  /**
   * Get activity log by type
   */
  async getActivityByType(activityType: string, limit: number = 20): Promise<ActivityLog[]> {
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('activity_type', activityType)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching activity by type:', error);
      return [];
    }
  }

  /**
   * Get activity log for date range
   */
  async getActivityByDateRange(startDate: Date, endDate: Date): Promise<ActivityLog[]> {
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching activity by date range:', error);
      return [];
    }
  }

  /**
   * Format activity type for display
   */
  formatActivityType(type: string): string {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get activity icon
   */
  getActivityIcon(type: string): string {
    const iconMap: Record<string, string> = {
      'login': '🔐',
      'logout': '👋',
      'password_changed': '🔑',
      'avatar_updated': '🖼️',
      'avatar_deleted': '🗑️',
      'profile_updated': '✏️',
      'theme_changed': '🎨',
      'settings_updated': '⚙️',
      'cache_cleared': '🧹',
      'session_terminated': '🚪',
      'all_sessions_terminated': '🔒',
      'data_exported': '📦',
      'account_deleted': '❌',
      'subscription_updated': '💳',
      'notification_settings_updated': '🔔'
    };

    return iconMap[type] || '📝';
  }

  /**
   * Get activity color
   */
  getActivityColor(type: string): string {
    if (type.includes('delete') || type.includes('terminated')) return 'text-destructive';
    if (type.includes('updated') || type.includes('changed')) return 'text-primary';
    if (type.includes('login') || type.includes('created')) return 'text-green-500';
    return 'text-muted-foreground';
  }
}

export const activityLogService = new ActivityLogService();
