import { supabase } from '@/integrations/supabase/client';

export interface SecurityAuditEvent {
  action: string;
  resourceType: string;
  resourceId?: string;
  success: boolean;
  failureReason?: string;
  sensitiveDataAccessed: boolean;
  additionalContext?: Record<string, any>;
}

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
  failureReason: string | null;
  sensitiveDataAccessed: boolean;
  timestamp: string;
  sessionId: string | null;
  additionalContext: Record<string, any> | null;
}

export interface SecurityMetrics {
  totalEvents: number;
  failedAttempts: number;
  sensitiveDataAccess: number;
  uniqueUsers: number;
  topActions: Array<{ action: string; count: number }>;
  securityIncidents: number;
}

class SecurityAuditService {
  private sessionId: string = this.generateSessionId();

  // Log a security event
  async logSecurityEvent(event: SecurityAuditEvent): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const auditRecord = {
        user_id: user?.id || null,
        action: event.action,
        resource_type: event.resourceType,
        resource_id: event.resourceId || null,
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent.slice(0, 500), // Limit length
        success: event.success,
        failure_reason: event.failureReason || null,
        sensitive_data_accessed: event.sensitiveDataAccessed,
        session_id: this.sessionId,
        additional_context: event.additionalContext || null
      };

      const { error } = await supabase
        .from('security_audit_logs')
        .insert(auditRecord);

      if (error) {
        console.error('Failed to log security event:', error);
        return false;
      }

      // Check for security incidents
      if (!event.success || event.sensitiveDataAccessed) {
        await this.checkSecurityIncidents(event);
      }

      return true;
    } catch (error) {
      console.error('Security audit logging error:', error);
      return false;
    }
  }

  // Log authentication events
  async logAuthEvent(action: 'login' | 'logout' | 'signup' | 'password_reset', success: boolean, failureReason?: string): Promise<void> {
    await this.logSecurityEvent({
      action: `auth_${action}`,
      resourceType: 'authentication',
      success,
      failureReason,
      sensitiveDataAccessed: action === 'login' && success
    });
  }

  // Log data access events
  async logDataAccess(resourceType: string, resourceId: string, action: string, sensitiveData: boolean = false): Promise<void> {
    await this.logSecurityEvent({
      action: `data_${action}`,
      resourceType,
      resourceId,
      success: true,
      sensitiveDataAccessed: sensitiveData
    });
  }

  // Log medication-related events (HIPAA compliance)
  async logMedicationAccess(medicationId: string, action: 'view' | 'create' | 'update' | 'delete' | 'share'): Promise<void> {
    await this.logSecurityEvent({
      action: `medication_${action}`,
      resourceType: 'user_medication',
      resourceId: medicationId,
      success: true,
      sensitiveDataAccessed: true, // All medication data is sensitive
      additionalContext: {
        hipaaRelevant: true,
        dataClassification: 'PHI' // Protected Health Information
      }
    });
  }

  // Log file upload/access events
  async logFileEvent(action: 'upload' | 'download' | 'delete', fileName: string, fileType: string, success: boolean): Promise<void> {
    await this.logSecurityEvent({
      action: `file_${action}`,
      resourceType: 'storage_object',
      resourceId: fileName,
      success,
      sensitiveDataAccessed: fileType.includes('medical') || fileType.includes('prescription'),
      additionalContext: {
        fileType,
        fileName
      }
    });
  }

  // Log API calls to external services
  async logAPICall(service: string, endpoint: string, success: boolean, failureReason?: string): Promise<void> {
    await this.logSecurityEvent({
      action: 'api_call',
      resourceType: 'external_api',
      resourceId: `${service}:${endpoint}`,
      success,
      failureReason,
      sensitiveDataAccessed: false,
      additionalContext: {
        service,
        endpoint
      }
    });
  }

  // Get audit logs for current user
  async getUserAuditLogs(limit: number = 50): Promise<AuditLogEntry[]> {
    try {
      const { data, error } = await supabase
        .from('security_audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Map database fields to interface fields
      return (data || []).map(log => ({
        id: log.id,
        userId: log.user_id,
        action: log.action,
        resourceType: log.resource_type,
        resourceId: log.resource_id,
        ipAddress: log.ip_address as string | null,
        userAgent: log.user_agent,
        success: log.success,
        failureReason: log.failure_reason,
        sensitiveDataAccessed: log.sensitive_data_accessed,
        timestamp: log.timestamp,
        sessionId: log.session_id,
        additionalContext: log.additional_context as Record<string, any> | null
      }));
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return [];
    }
  }

  // Get security metrics (admin function)
  async getSecurityMetrics(startDate: Date, endDate: Date): Promise<SecurityMetrics> {
    try {
      const { data, error } = await supabase
        .from('security_audit_logs')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      if (error) throw error;

      const logs = data || [];
      
      // Calculate metrics
      const totalEvents = logs.length;
      const failedAttempts = logs.filter(log => !log.success).length;
      const sensitiveDataAccess = logs.filter(log => log.sensitive_data_accessed).length;
      const uniqueUsers = new Set(logs.map(log => log.user_id).filter(Boolean)).size;
      const securityIncidents = logs.filter(log => 
        !log.success || (log.sensitive_data_accessed && log.action.includes('unauthorized'))
      ).length;

      // Top actions
      const actionCounts = logs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topActions = Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalEvents,
        failedAttempts,
        sensitiveDataAccess,
        uniqueUsers,
        topActions,
        securityIncidents
      };
    } catch (error) {
      console.error('Failed to get security metrics:', error);
      return {
        totalEvents: 0,
        failedAttempts: 0,
        sensitiveDataAccess: 0,
        uniqueUsers: 0,
        topActions: [],
        securityIncidents: 0
      };
    }
  }

  // Check for potential security incidents
  private async checkSecurityIncidents(event: SecurityAuditEvent): Promise<void> {
    try {
      // Check for multiple failed login attempts
      if (event.action.includes('auth_login') && !event.success) {
        const recentFailures = await this.getRecentFailures('auth_login', 15); // 15 minutes
        if (recentFailures >= 5) {
          await this.createSecurityAlert('multiple_failed_logins', {
            failureCount: recentFailures,
            timeWindow: '15 minutes'
          });
        }
      }

      // Check for unusual data access patterns
      if (event.sensitiveDataAccessed) {
        const recentSensitiveAccess = await this.getRecentSensitiveAccess(60); // 1 hour
        if (recentSensitiveAccess >= 20) {
          await this.createSecurityAlert('excessive_sensitive_data_access', {
            accessCount: recentSensitiveAccess,
            timeWindow: '1 hour'
          });
        }
      }
    } catch (error) {
      console.error('Security incident check failed:', error);
    }
  }

  // Get recent failures for a specific action
  private async getRecentFailures(action: string, minutesBack: number): Promise<number> {
    const cutoff = new Date(Date.now() - minutesBack * 60 * 1000);
    
    const { data } = await supabase
      .from('security_audit_logs')
      .select('id', { count: 'exact' })
      .eq('action', action)
      .eq('success', false)
      .gte('timestamp', cutoff.toISOString());

    return data?.length || 0;
  }

  // Get recent sensitive data access
  private async getRecentSensitiveAccess(minutesBack: number): Promise<number> {
    const cutoff = new Date(Date.now() - minutesBack * 60 * 1000);
    
    const { data } = await supabase
      .from('security_audit_logs')
      .select('id', { count: 'exact' })
      .eq('sensitive_data_accessed', true)
      .gte('timestamp', cutoff.toISOString());

    return data?.length || 0;
  }

  // Create security alert
  private async createSecurityAlert(type: string, context: Record<string, any>): Promise<void> {
    await this.logSecurityEvent({
      action: 'security_alert',
      resourceType: 'security_system',
      resourceId: type,
      success: true,
      sensitiveDataAccessed: false,
      additionalContext: {
        alertType: type,
        ...context,
        severity: 'high'
      }
    });
  }

  // Get client IP (approximate, for logging purposes)
  private async getClientIP(): Promise<string | null> {
    try {
      // In a real application, this would come from server-side headers
      // For client-side, we can only get an approximate location
      return null; // Will be filled by edge function if needed
    } catch {
      return null;
    }
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // HIPAA compliance helper - mark data as PHI
  async markPHIAccess(resourceType: string, resourceId: string, action: string): Promise<void> {
    await this.logSecurityEvent({
      action: `phi_${action}`,
      resourceType,
      resourceId,
      success: true,
      sensitiveDataAccessed: true,
      additionalContext: {
        hipaaCompliance: true,
        dataClassification: 'PHI',
        requiresAudit: true
      }
    });
  }

  // Generate compliance report
  async generateComplianceReport(startDate: Date, endDate: Date): Promise<any> {
    const metrics = await this.getSecurityMetrics(startDate, endDate);
    const phiAccess = await this.getPHIAccessLogs(startDate, endDate);
    
    return {
      reportGenerated: new Date().toISOString(),
      period: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      metrics,
      phiAccess,
      complianceScore: this.calculateComplianceScore(metrics),
      recommendations: this.generateRecommendations(metrics)
    };
  }

  private async getPHIAccessLogs(startDate: Date, endDate: Date): Promise<any[]> {
    const { data } = await supabase
      .from('security_audit_logs')
      .select('*')
      .eq('sensitive_data_accessed', true)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: false });

    return data || [];
  }

  private calculateComplianceScore(metrics: SecurityMetrics): number {
    let score = 100;
    
    // Deduct points for security issues
    if (metrics.securityIncidents > 0) score -= metrics.securityIncidents * 10;
    if (metrics.failedAttempts > metrics.totalEvents * 0.1) score -= 15; // > 10% failure rate
    
    return Math.max(0, Math.min(100, score));
  }

  private generateRecommendations(metrics: SecurityMetrics): string[] {
    const recommendations: string[] = [];
    
    if (metrics.securityIncidents > 0) {
      recommendations.push('Review security incidents and implement additional protective measures');
    }
    
    if (metrics.failedAttempts > metrics.totalEvents * 0.05) {
      recommendations.push('Consider implementing additional authentication measures (MFA, CAPTCHA)');
    }
    
    if (metrics.sensitiveDataAccess > metrics.totalEvents * 0.3) {
      recommendations.push('Review sensitive data access patterns and implement additional access controls');
    }
    
    return recommendations;
  }
}

export const securityAuditService = new SecurityAuditService();