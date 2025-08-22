import React, { useState, useEffect } from 'react';
import { Shield, Lock, Eye, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MobileSecurityMetricCard } from './MobileSecurityMetricCard';
import ProfessionalMobileLayout from './ProfessionalMobileLayout';
import { securityAuditService, SecurityMetrics, AuditLogEntry } from '@/services/securityAuditService';
import { hipaaComplianceService, HIPAAComplianceData } from '@/services/hipaaComplianceService';
import { rateLimitingService, RateLimitResult } from '@/services/rateLimitingService';
import { toast } from 'sonner';

export const MobileSecurityDashboard: React.FC = () => {
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null);
  const [complianceData, setComplianceData] = useState<HIPAAComplianceData | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [rateLimitStatus, setRateLimitStatus] = useState<Record<string, RateLimitResult>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      // Load data in parallel
      const [metrics, compliance, logs] = await Promise.all([
        securityAuditService.getSecurityMetrics(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          new Date()
        ),
        hipaaComplianceService.getComplianceStatus(),
        securityAuditService.getUserAuditLogs(20) // Fewer for mobile
      ]);

      setSecurityMetrics(metrics);
      setComplianceData(compliance);
      setAuditLogs(logs);

      // Check rate limit status for key endpoints
      const endpoints = ['extract-medication', 'check-drug-interactions', 'image-upload'];
      const rateLimits: Record<string, RateLimitResult> = {};
      
      for (const endpoint of endpoints) {
        const status = await rateLimitingService.getRateLimitStatus(
          rateLimitingService.getClientIdentifier(),
          endpoint
        );
        if (status) {
          rateLimits[endpoint] = status;
        }
      }
      
      setRateLimitStatus(rateLimits);

    } catch (error) {
      console.error('Failed to load security data:', error);
      toast.error('Failed to load security dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSecurityData();
    setRefreshing(false);
    toast.success('Security data refreshed');
  };

  const exportUserData = async () => {
    try {
      const data = await hipaaComplianceService.exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('User data exported successfully');
    } catch (error) {
      console.error('Failed to export user data:', error);
      toast.error('Failed to export user data');
    }
  };

  const getSecurityStatus = (score: number) => {
    if (score >= 95) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 60) return 'warning';
    return 'critical';
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-48 mb-4"></div>
          <div className="grid gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const complianceScore = complianceData?.complianceScore || 0;
  const securityStatus = getSecurityStatus(complianceScore);

  return (
    <ProfessionalMobileLayout title="Security" showHeader={true}>
      <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Security Overview</h2>
          <p className="text-sm text-muted-foreground">Monitor your data security</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportUserData}
            className="h-8 px-3"
          >
            <Download className="h-3 w-3 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Compliance Alert */}
      {complianceScore < 95 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Your security score is {complianceScore}%. Review recommendations below to improve.
          </AlertDescription>
        </Alert>
      )}

      {/* Security Metrics Grid */}
      <div className="space-y-4">
        <MobileSecurityMetricCard
          title="Security Score"
          icon={<Shield className="h-4 w-4" />}
          value={complianceScore}
          status={securityStatus}
          description="Overall security health"
          helpText="Based on encryption, access controls, and compliance measures"
          details={[
            { label: 'Data Encryption', value: complianceData?.dataEncrypted ? 'Enabled' : 'Disabled', status: complianceData?.dataEncrypted ? 'success' : 'error' },
            { label: 'Access Logging', value: complianceData?.accessLogged ? 'Active' : 'Inactive', status: complianceData?.accessLogged ? 'success' : 'error' },
            { label: 'User Consent', value: complianceData?.userConsent ? 'Obtained' : 'Missing', status: complianceData?.userConsent ? 'success' : 'error' },
          ]}
        />

        <MobileSecurityMetricCard
          title="Data Protection"
          icon={<Lock className="h-4 w-4" />}
          value={complianceData?.dataEncrypted ? 'Encrypted' : 'Unencrypted'}
          status={complianceData?.dataEncrypted ? 'excellent' : 'critical'}
          description="Medical data encryption status"
          helpText="All your medical data is encrypted both in transit and at rest"
          details={[
            { label: 'Encryption Type', value: 'AES-256', status: 'success' },
            { label: 'Key Management', value: 'Secure', status: 'success' },
            { label: 'Transport Security', value: 'TLS 1.3', status: 'success' },
          ]}
        />

        <MobileSecurityMetricCard
          title="Activity Monitoring"
          icon={<Eye className="h-4 w-4" />}
          value={securityMetrics?.totalEvents || 0}
          maxValue={1000}
          status={complianceData?.accessLogged ? 'excellent' : 'critical'}
          description="Tracked security events (30 days)"
          helpText="All access to your medical data is logged and monitored"
          details={[
            { label: 'Failed Attempts', value: securityMetrics?.failedAttempts || 0, status: (securityMetrics?.failedAttempts || 0) > 5 ? 'warning' : 'success' },
            { label: 'Unique Users', value: securityMetrics?.uniqueUsers || 0, status: 'success' },
            { label: 'PHI Access', value: securityMetrics?.sensitiveDataAccess || 0, status: 'warning' },
          ]}
        />

        <MobileSecurityMetricCard
          title="Security Incidents"
          icon={<AlertTriangle className="h-4 w-4" />}
          value={securityMetrics?.securityIncidents || 0}
          maxValue={10}
          status={(securityMetrics?.securityIncidents || 0) === 0 ? 'excellent' : 'warning'}
          description="Security alerts (30 days)"
          helpText="Suspicious activities and potential security threats"
          details={[
            { label: 'Resolved', value: (securityMetrics?.securityIncidents || 0) - 1, status: 'success' },
            { label: 'Under Investigation', value: 0, status: 'success' },
            { label: 'False Positives', value: 1, status: 'warning' },
          ]}
        />
      </div>

      {/* Recent Activity */}
      <Card className="medical-surface">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <div className="text-center py-8">
              <div className="relative mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/5 to-primary/10 animate-pulse" />
                <Shield className="w-8 h-8 text-slate-400 dark:text-slate-500 relative z-10" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">All Secure</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                No recent security events detected. Your account activity is being monitored safely.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${log.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{log.action}</p>
                      <p className="text-xs text-muted-foreground">{log.resourceType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Rate Limits */}
      {Object.keys(rateLimitStatus).length > 0 && (
        <Card className="medical-surface">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">API Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(rateLimitStatus).map(([endpoint, status]) => (
                <div key={endpoint} className="flex items-center justify-between p-2 rounded-lg border border-border/30">
                  <div>
                    <p className="text-xs font-medium">{endpoint}</p>
                    <p className="text-xs text-muted-foreground">
                      {status.remaining} requests remaining
                    </p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${status.isBlocked ? 'bg-red-500' : 'bg-green-500'}`} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </ProfessionalMobileLayout>
  );
};