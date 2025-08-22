import { supabase } from '@/integrations/supabase/client';
import { environmentService } from './environmentService';
import { errorMonitoringService } from './errorMonitoringService';

export interface PerformanceMetric {
  metric_name: string;
  metric_value: number;
  timestamp: string;
  session_id: string;
  user_id?: string;
  context?: Record<string, any>;
}

export interface ScanPerformanceData {
  scanMethod: 'camera' | 'upload';
  processingTime: number;
  confidence: number;
  success: boolean;
  errorType?: string;
  imageSize?: number;
  deviceType: string;
}

class PerformanceMonitoringService {
  private sessionId: string;
  private performanceQueue: PerformanceMetric[] = [];
  private scanMetrics: ScanPerformanceData[] = [];

  constructor() {
    this.sessionId = `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.setupPerformanceObservers();
    this.trackAppStartup();
  }

  private setupPerformanceObservers(): void {
    // Navigation Timing API
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.recordMetric(entry.name, entry.duration, {
              entryType: entry.entryType,
              startTime: entry.startTime
            });
          });
        });

        observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
      } catch (error) {
        errorMonitoringService.logWarning('Failed to setup performance observer', error);
      }
    }

    // Memory usage monitoring (if available)
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.recordMetric('memory_used_mb', memory.usedJSHeapSize / 1024 / 1024);
        this.recordMetric('memory_total_mb', memory.totalJSHeapSize / 1024 / 1024);
        this.recordMetric('memory_limit_mb', memory.jsHeapSizeLimit / 1024 / 1024);
      }, 30000); // Every 30 seconds
    }
  }

  private trackAppStartup(): void {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const timing = performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
        
        this.recordMetric('app_load_time_ms', loadTime);
        this.recordMetric('dom_ready_time_ms', domReady);
        this.recordMetric('first_paint_time_ms', timing.responseStart - timing.navigationStart);
      }, 100);
    });
  }

  async recordMetric(name: string, value: number, context?: Record<string, any>): Promise<void> {
    const metric: PerformanceMetric = {
      metric_name: name,
      metric_value: value,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      context
    };

    if (environmentService.env.enableLogging && environmentService.env.isDevelopment) {
      console.debug(`[Performance] ${name}: ${value}`, context);
    }

    this.performanceQueue.push(metric);

    // Batch send metrics every 10 entries or 30 seconds
    if (this.performanceQueue.length >= 10) {
      await this.flushMetrics();
    }
  }

  async trackScanPerformance(data: ScanPerformanceData): Promise<void> {
    this.scanMetrics.push(data);

    // Record individual metrics
    await this.recordMetric('scan_processing_time_ms', data.processingTime, {
      method: data.scanMethod,
      success: data.success,
      confidence: data.confidence,
      device_type: data.deviceType
    });

    await this.recordMetric('scan_confidence_score', data.confidence, {
      method: data.scanMethod,
      success: data.success
    });

    if (data.imageSize) {
      await this.recordMetric('scan_image_size_kb', data.imageSize / 1024, {
        method: data.scanMethod
      });
    }

    // Calculate and track accuracy metrics
    await this.updateScanAccuracyMetrics();
  }

  private async updateScanAccuracyMetrics(): Promise<void> {
    const recentScans = this.scanMetrics.slice(-50); // Last 50 scans
    const successfulScans = recentScans.filter(scan => scan.success);
    const accuracyRate = recentScans.length > 0 ? (successfulScans.length / recentScans.length) * 100 : 0;

    await this.recordMetric('scan_accuracy_rate_percent', accuracyRate, {
      sample_size: recentScans.length
    });

    // Average processing time by method
    const cameraScanTimes = recentScans
      .filter(scan => scan.scanMethod === 'camera' && scan.success)
      .map(scan => scan.processingTime);
    
    if (cameraScanTimes.length > 0) {
      const avgCameraTime = cameraScanTimes.reduce((a, b) => a + b, 0) / cameraScanTimes.length;
      await this.recordMetric('avg_camera_scan_time_ms', avgCameraTime);
    }

    const uploadScanTimes = recentScans
      .filter(scan => scan.scanMethod === 'upload' && scan.success)
      .map(scan => scan.processingTime);
    
    if (uploadScanTimes.length > 0) {
      const avgUploadTime = uploadScanTimes.reduce((a, b) => a + b, 0) / uploadScanTimes.length;
      await this.recordMetric('avg_upload_scan_time_ms', avgUploadTime);
    }
  }

  async trackPageLoad(pageName: string): Promise<void> {
    const startTime = performance.now();
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const loadTime = performance.now() - startTime;
        this.recordMetric('page_load_time_ms', loadTime, { page: pageName });
        resolve();
      }, 100);
    });
  }

  async trackUserInteraction(interaction: string, responseTime: number): Promise<void> {
    await this.recordMetric('user_interaction_response_ms', responseTime, {
      interaction_type: interaction
    });
  }

  async trackApiCall(endpoint: string, responseTime: number, success: boolean): Promise<void> {
    await this.recordMetric('api_response_time_ms', responseTime, {
      endpoint,
      success,
      status: success ? 'success' : 'error'
    });
  }

  private async flushMetrics(): Promise<void> {
    if (this.performanceQueue.length === 0) return;

    const metrics = [...this.performanceQueue];
    this.performanceQueue = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const metricsWithUser = metrics.map(metric => ({
        ...metric,
        user_id: user?.id
      }));

      const { error } = await supabase
        .from('performance_metrics')
        .insert(metricsWithUser);

      if (error) {
        errorMonitoringService.logError('Failed to save performance metrics', error);
        // Re-queue metrics for retry
        this.performanceQueue.unshift(...metrics);
      }
    } catch (error) {
      errorMonitoringService.logError('Performance monitoring failed', error);
      // Re-queue metrics for retry
      this.performanceQueue.unshift(...metrics);
    }
  }

  async getPerformanceReport(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .eq('session_id', this.sessionId)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;

      return {
        sessionMetrics: data,
        scanAccuracy: this.calculateScanAccuracy(),
        averageResponseTimes: this.calculateAverageResponseTimes(data || []),
        performanceScore: this.calculatePerformanceScore(data || [])
      };
    } catch (error) {
      errorMonitoringService.logError('Failed to generate performance report', error);
      return null;
    }
  }

  private calculateScanAccuracy(): any {
    const recentScans = this.scanMetrics.slice(-100);
    const successfulScans = recentScans.filter(scan => scan.success);
    
    return {
      totalScans: recentScans.length,
      successfulScans: successfulScans.length,
      accuracyRate: recentScans.length > 0 ? (successfulScans.length / recentScans.length) * 100 : 0,
      averageConfidence: successfulScans.length > 0 
        ? successfulScans.reduce((sum, scan) => sum + scan.confidence, 0) / successfulScans.length 
        : 0
    };
  }

  private calculateAverageResponseTimes(metrics: PerformanceMetric[]): any {
    const responseTimeMetrics = metrics.filter(m => m.metric_name.includes('response_time') || m.metric_name.includes('processing_time'));
    
    return responseTimeMetrics.reduce((acc, metric) => {
      const category = metric.metric_name.replace('_ms', '').replace('_time', '');
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0 };
      }
      acc[category].total += metric.metric_value;
      acc[category].count += 1;
      acc[category].average = acc[category].total / acc[category].count;
      return acc;
    }, {} as Record<string, any>);
  }

  private calculatePerformanceScore(metrics: PerformanceMetric[]): number {
    // Simple performance scoring based on key metrics
    const scanAccuracy = this.calculateScanAccuracy();
    const avgLoadTime = metrics.find(m => m.metric_name === 'app_load_time_ms')?.metric_value || 3000;
    
    let score = 100;
    
    // Deduct points for poor scan accuracy
    if (scanAccuracy.accuracyRate < 90) score -= (90 - scanAccuracy.accuracyRate);
    
    // Deduct points for slow load times
    if (avgLoadTime > 2000) score -= Math.min(20, (avgLoadTime - 2000) / 100);
    
    return Math.max(0, Math.min(100, score));
  }

  // Cleanup method for component unmounts
  destroy(): void {
    this.flushMetrics();
  }
}

export const performanceMonitoringService = new PerformanceMonitoringService();

// Auto-flush metrics every 30 seconds
setInterval(() => {
  performanceMonitoringService['flushMetrics']();
}, 30000);