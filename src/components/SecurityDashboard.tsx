import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock, Eye, AlertTriangle, CheckCircle, Download } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileSecurityDashboard } from '@/components/mobile/MobileSecurityDashboard';
import { securityAuditService, SecurityMetrics, AuditLogEntry } from '@/services/securityAuditService';
import { hipaaComplianceService, HIPAAComplianceData } from '@/services/hipaaComplianceService';
import { rateLimitingService, RateLimitResult } from '@/services/rateLimitingService';
import { useToast } from '@/hooks/use-toast';

export function SecurityDashboard() {
  const isMobile = useIsMobile();
  
  // All hooks must be called at the top level - BEFORE any conditional returns
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null);
  const [complianceData, setComplianceData] = useState<HIPAAComplianceData | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [rateLimitStatus, setRateLimitStatus] = useState<Record<string, RateLimitResult>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // ALL hooks including useEffect must be declared before any conditional returns
  useEffect(() => {
    if (!isMobile) {
      loadSecurityData();
    }
  }, [isMobile]);

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
        securityAuditService.getUserAuditLogs(50)
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
      toast({
        title: "Error",
        description: "Failed to load security dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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

      toast({
        title: "Success",
        description: "User data exported successfully",
      });
    } catch (error) {
      console.error('Failed to export user data:', error);
      toast({
        title: "Error",
        description: "Failed to export user data",
        variant: "destructive"
      });
    }
  };

  const generateComplianceReport = async () => {
    try {
      const report = await hipaaComplianceService.generateComplianceReport();
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hipaa-compliance-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "HIPAA compliance report generated",
      });
    } catch (error) {
      console.error('Failed to generate compliance report:', error);
      toast({
        title: "Error",
        description: "Failed to generate compliance report",
        variant: "destructive"
      });
    }
  };

  // Use mobile version on mobile devices - AFTER all hooks are declared
  if (isMobile) {
    return <MobileSecurityDashboard />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-muted-foreground">Monitor security, compliance, and audit logs</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportUserData} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={generateComplianceReport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            HIPAA Report
          </Button>
        </div>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {complianceData?.complianceScore || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {complianceData?.complianceScore >= 95 ? 'Excellent' : 
               complianceData?.complianceScore >= 80 ? 'Good' : 'Needs Attention'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Encryption</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {complianceData?.dataEncrypted ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
              <span className="text-sm font-medium">
                {complianceData?.dataEncrypted ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit Logging</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {complianceData?.accessLogged ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
              <span className="text-sm font-medium">
                {complianceData?.accessLogged ? 'Active' : 'Inactive'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {securityMetrics?.securityIncidents || 0}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* HIPAA Compliance Alert */}
      {complianceData && complianceData.complianceScore < 95 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your HIPAA compliance score is below the recommended threshold. 
            Please review the compliance report for recommendations.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">Security Metrics</TabsTrigger>
          <TabsTrigger value="compliance">HIPAA Compliance</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="ratelimits">Rate Limits</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Activity Summary</CardTitle>
                <CardDescription>Security events from the last 30 days</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Events</span>
                  <span className="font-semibold">{securityMetrics?.totalEvents || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Failed Attempts</span>
                  <span className="font-semibold text-red-500">{securityMetrics?.failedAttempts || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sensitive Data Access</span>
                  <span className="font-semibold text-amber-500">{securityMetrics?.sensitiveDataAccess || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Unique Users</span>
                  <span className="font-semibold">{securityMetrics?.uniqueUsers || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Actions</CardTitle>
                <CardDescription>Most frequent security events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {securityMetrics?.topActions.slice(0, 5).map((action, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{action.action}</span>
                      <Badge variant="outline">{action.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>HIPAA Compliance Status</CardTitle>
              <CardDescription>Current compliance with healthcare regulations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {complianceData?.dataEncrypted ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <span>Data Encryption</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {complianceData?.accessLogged ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <span>Access Logging</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {complianceData?.userConsent ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <span>User Consent</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Data Retention Policy</span>
                    <p className="text-sm">{complianceData?.dataRetentionPolicy}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Last Audit</span>
                    <p className="text-sm">{complianceData?.lastAuditDate !== 'Never' ? 
                      new Date(complianceData?.lastAuditDate || '').toLocaleDateString() : 'Never'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Audit Logs</CardTitle>
              <CardDescription>Security events and data access logs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {log.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{log.action}</p>
                        <p className="text-xs text-muted-foreground">{log.resourceType}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                      {log.sensitiveDataAccessed && (
                        <Badge variant="outline" className="text-xs">PHI Access</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratelimits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rate Limit Status</CardTitle>
              <CardDescription>Current API rate limiting status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(rateLimitStatus).map(([endpoint, status]) => (
                  <div key={endpoint} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{endpoint}</p>
                      <p className="text-xs text-muted-foreground">
                        {status.remaining} requests remaining
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={status.isBlocked ? "destructive" : "outline"}>
                        {status.isBlocked ? 'Blocked' : 'Active'}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        Resets: {status.resetTime.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}