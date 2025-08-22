import { supabase } from '@/integrations/supabase/client';
import { environmentService } from './environmentService';

export interface ErrorReport {
  id?: string;
  error_type: string;
  error_message: string;
  stack_trace?: string;
  user_id?: string;
  session_id: string;
  url: string;
  user_agent: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
  resolved?: boolean;
}

export interface CrashReport {
  crash_id: string;
  app_version: string;
  platform: string;
  device_info: Record<string, any>;
  stack_trace: string;
  user_actions: string[];
  timestamp: string;
}

class ErrorMonitoringService {
  private sessionId: string;
  private errorQueue: ErrorReport[] = [];
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.setupGlobalErrorHandling();
    this.setupNetworkMonitoring();
  }

  private setupGlobalErrorHandling(): void {
    // Global JavaScript error handling
    window.addEventListener('error', (event) => {
      this.captureError({
        error_type: 'javascript_error',
        error_message: event.message,
        stack_trace: event.error?.stack,
        severity: 'high',
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Promise rejection handling
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        error_type: 'promise_rejection',
        error_message: event.reason?.message || String(event.reason),
        stack_trace: event.reason?.stack,
        severity: 'high',
        context: {
          promise: event.promise
        }
      });
    });

    // React error boundary integration
    window.addEventListener('react-error', ((event: CustomEvent) => {
      this.captureError({
        error_type: 'react_error',
        error_message: event.detail.error.message,
        stack_trace: event.detail.error.stack,
        severity: 'critical',
        context: {
          componentStack: event.detail.errorInfo?.componentStack,
          errorBoundary: event.detail.errorBoundary
        }
      });
    }) as EventListener);
  }

  private setupNetworkMonitoring(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async captureError(errorData: Partial<ErrorReport>): Promise<void> {
    const error: ErrorReport = {
      error_type: errorData.error_type || 'unknown',
      error_message: errorData.error_message || 'Unknown error',
      stack_trace: errorData.stack_trace,
      session_id: this.sessionId,
      url: window.location.href,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      severity: errorData.severity || 'medium',
      context: errorData.context,
      resolved: false
    };

    // Log to console in development
    if (environmentService.env.enableLogging) {
      console.error('[Error Monitor]', error);
    }

    if (this.isOnline) {
      await this.sendErrorReport(error);
    } else {
      this.queueError(error);
    }
  }

  private async sendErrorReport(error: ErrorReport): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Use usage_analytics table for now until types are updated
      const { error: dbError } = await supabase
        .from('usage_analytics')
        .insert({
          event_type: 'error_report',
          event_data: {
            error_type: error.error_type,
            error_message: error.error_message,
            stack_trace: error.stack_trace,
            url: error.url,
            severity: error.severity,
            context: error.context
          },
          session_id: error.session_id,
          user_agent: error.user_agent,
          timestamp: error.timestamp,
          user_id: user?.id
        });

      if (dbError) {
        console.error('Failed to save error report:', dbError);
        this.queueError(error);
      }
    } catch (err) {
      console.error('Error monitoring service failed:', err);
      this.queueError(error);
    }
  }

  private queueError(error: ErrorReport): void {
    this.errorQueue.push(error);
    
    // Limit queue size
    if (this.errorQueue.length > 50) {
      this.errorQueue = this.errorQueue.slice(-50);
    }
    
    // Store in localStorage for persistence
    try {
      localStorage.setItem('error_queue', JSON.stringify(this.errorQueue));
    } catch (err) {
      console.warn('Failed to store error queue in localStorage');
    }
  }

  private async flushErrorQueue(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      localStorage.removeItem('error_queue');
    } catch (err) {
      console.warn('Failed to clear error queue from localStorage');
    }

    for (const error of errors) {
      await this.sendErrorReport(error);
    }
  }

  async reportCrash(crashData: Partial<CrashReport>): Promise<void> {
    const crash: CrashReport = {
      crash_id: `crash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      app_version: environmentService.env.appVersion,
      platform: this.detectPlatform(),
      device_info: await this.getDeviceInfo(),
      stack_trace: crashData.stack_trace || 'No stack trace available',
      user_actions: crashData.user_actions || [],
      timestamp: new Date().toISOString()
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Use usage_analytics table for now until types are updated
      const { error } = await supabase
        .from('usage_analytics')
        .insert({
          event_type: 'crash_report',
          event_data: {
            crash_id: crash.crash_id,
            app_version: crash.app_version,
            platform: crash.platform,
            device_info: crash.device_info,
            stack_trace: crash.stack_trace,
            user_actions: crash.user_actions
          } as any,
          session_id: crash.crash_id,
          timestamp: crash.timestamp,
          user_id: user?.id,
          platform: crash.platform
        });

      if (error) {
        console.error('Failed to save crash report:', error);
      }
    } catch (err) {
      console.error('Crash reporting failed:', err);
    }
  }

  private detectPlatform(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/android/.test(userAgent)) return 'android';
    if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
    if (/mobile/.test(userAgent)) return 'mobile_web';
    return 'desktop_web';
  }

  private async getDeviceInfo(): Promise<Record<string, any>> {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      memory: (navigator as any).deviceMemory || 'unknown',
      connection: (navigator as any).connection?.effectiveType || 'unknown'
    };
  }

  // Enhanced logging methods to replace console.error calls
  logError(message: string, context?: any): void {
    this.captureError({
      error_type: 'application_error',
      error_message: message,
      severity: 'medium',
      context
    });
  }

  logWarning(message: string, context?: any): void {
    if (environmentService.env.enableLogging) {
      console.warn(message, context);
    }
    
    this.captureError({
      error_type: 'application_warning',
      error_message: message,
      severity: 'low',
      context
    });
  }

  logInfo(message: string, context?: any): void {
    if (environmentService.env.enableLogging) {
      console.info(message, context);
    }
  }

  logDebug(message: string, context?: any): void {
    if (environmentService.env.enableLogging && environmentService.env.isDevelopment) {
      console.debug(message, context);
    }
  }
}

export const errorMonitoringService = new ErrorMonitoringService();