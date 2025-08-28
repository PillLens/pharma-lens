import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsEvent {
  event_type: string;
  event_data?: Record<string, any>;
  session_id?: string;
  user_agent?: string;
  platform?: string;
  version?: string;
}

class AnalyticsService {
  private sessionId: string;
  private platform: string;
  private version: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.platform = this.detectPlatform();
    this.version = '1.0.0'; // Would come from package.json or build process
  }

  async trackEvent(eventType: string, eventData?: Record<string, any>): Promise<void> {
    try {
      const { error } = await supabase
        .from('usage_analytics')
        .insert({
          event_type: eventType,
          event_data: eventData || {},
          session_id: this.sessionId,
          user_agent: navigator.userAgent,
          platform: this.platform,
          version: this.version,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('Analytics tracking failed:', error);
      }
    } catch (error) {
      // Fail silently for analytics to not disrupt user experience
      console.error('Analytics error:', error);
    }
  }

  // Common tracking methods
  async trackScanAttempt(method: 'camera' | 'upload'): Promise<void> {
    await this.trackEvent('scan_attempt', { method });
  }

  async trackScanSuccess(
    method: 'camera' | 'upload', 
    processingTime: number, 
    confidence: number
  ): Promise<void> {
    await this.trackEvent('scan_success', { 
      method, 
      processing_time_ms: processingTime,
      confidence_score: confidence
    });
  }

  async trackScanFailure(method: 'camera' | 'upload', error: string): Promise<void> {
    await this.trackEvent('scan_failure', { method, error_type: error });
  }

  async trackMedicationAdd(source: 'scan' | 'manual'): Promise<void> {
    await this.trackEvent('medication_add', { source });
  }

  async trackSafetyAlert(alertType: string, severity: string): Promise<void> {
    await this.trackEvent('safety_alert', { alert_type: alertType, severity });
  }

  async trackFeatureUsage(feature: string): Promise<void> {
    await this.trackEvent('feature_usage', { feature });
  }

  async trackPerformanceMetric(metric: string, value: number): Promise<void> {
    await this.trackEvent('performance_metric', { metric, value });
  }

  async trackUserFlow(step: string, completed: boolean): Promise<void> {
    await this.trackEvent('user_flow', { step, completed });
  }

  // Session and device detection
  private generateSessionId(): string {
    // Generate a proper UUID format for session_id
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for older browsers - generate a UUID-like string
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private detectPlatform(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/android/.test(userAgent)) return 'android';
    if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
    if (/mobile/.test(userAgent)) return 'mobile_web';
    return 'desktop_web';
  }

  // Privacy-compliant data collection
  async getAggregateMetrics(startDate: string, endDate: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('usage_analytics')
        .select('event_type, event_data, timestamp, platform')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate);

      if (error) throw error;

      // Aggregate metrics without exposing individual user data
      const metrics = {
        totalEvents: data?.length || 0,
        scanAttempts: data?.filter(d => d.event_type === 'scan_attempt').length || 0,
        scanSuccess: data?.filter(d => d.event_type === 'scan_success').length || 0,
        platformBreakdown: this.aggregateByPlatform(data || []),
        featureUsage: this.aggregateFeatureUsage(data || [])
      };

      return metrics;
    } catch (error) {
      console.error('Failed to get analytics metrics:', error);
      return null;
    }
  }

  private aggregateByPlatform(data: any[]): Record<string, number> {
    return data.reduce((acc, item) => {
      acc[item.platform] = (acc[item.platform] || 0) + 1;
      return acc;
    }, {});
  }

  private aggregateFeatureUsage(data: any[]): Record<string, number> {
    return data
      .filter(item => item.event_type === 'feature_usage')
      .reduce((acc, item) => {
        const feature = item.event_data?.feature || 'unknown';
        acc[feature] = (acc[feature] || 0) + 1;
        return acc;
      }, {});
  }
}

export const analyticsService = new AnalyticsService();