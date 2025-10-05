import { supabase } from '@/integrations/supabase/client';

export interface UserSession {
  id: string;
  device_info: any;
  ip_address: string | null;
  last_active: string;
  created_at: string;
  user_agent: string | null;
  session_token: string | null;
  user_id: string;
}

class SessionManagementService {
  /**
   * Track current session
   */
  async trackSession(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const deviceInfo = this.getDeviceInfo();
      const sessionToken = crypto.randomUUID();

      const { error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: user.id,
          device_info: deviceInfo,
          user_agent: navigator.userAgent,
          session_token: sessionToken,
          last_active: new Date().toISOString()
        });

      if (error) throw error;

      // Store session token in localStorage for identification
      localStorage.setItem('current_session_token', sessionToken);
    } catch (error) {
      console.error('Error tracking session:', error);
    }
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(): Promise<void> {
    try {
      const sessionToken = localStorage.getItem('current_session_token');
      if (!sessionToken) return;

      const { error } = await supabase
        .from('user_sessions')
        .update({ last_active: new Date().toISOString() })
        .eq('session_token', sessionToken);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating session activity:', error);
    }
  }

  /**
   * Get all user sessions
   */
  async getUserSessions(): Promise<UserSession[]> {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .order('last_active', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      return [];
    }
  }

  /**
   * Logout from specific session
   */
  async logoutSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      // Log activity
      await supabase.rpc('log_activity', {
        p_activity_type: 'session_terminated',
        p_activity_data: { session_id: sessionId }
      });
    } catch (error) {
      console.error('Error logging out session:', error);
      throw error;
    }
  }

  /**
   * Logout from all other sessions
   */
  async logoutOtherSessions(): Promise<void> {
    try {
      const currentSessionToken = localStorage.getItem('current_session_token');
      if (!currentSessionToken) return;

      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .neq('session_token', currentSessionToken);

      if (error) throw error;

      // Log activity
      await supabase.rpc('log_activity', {
        p_activity_type: 'all_sessions_terminated',
        p_activity_data: {}
      });
    } catch (error) {
      console.error('Error logging out other sessions:', error);
      throw error;
    }
  }

  /**
   * Get device info from user agent
   */
  private getDeviceInfo() {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let os = 'Unknown';
    let device = 'Desktop';

    // Detect browser
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    // Detect OS
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS')) os = 'iOS';

    // Detect device type
    if (/mobile|android|iphone|ipad|ipod/i.test(ua)) {
      device = 'Mobile';
    } else if (/tablet|ipad/i.test(ua)) {
      device = 'Tablet';
    }

    return { browser, os, device };
  }

  /**
   * Get current session token
   */
  getCurrentSessionToken(): string | null {
    return localStorage.getItem('current_session_token');
  }

  /**
   * Cleanup old sessions (called periodically)
   */
  async cleanupOldSessions(): Promise<void> {
    try {
      await supabase.rpc('cleanup_old_sessions');
    } catch (error) {
      console.error('Error cleaning up old sessions:', error);
    }
  }
}

export const sessionManagementService = new SessionManagementService();
