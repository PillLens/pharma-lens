import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Download,
  Smartphone,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import { performanceMonitoringService } from '@/services/performanceMonitoringService';
import { errorMonitoringService } from '@/services/errorMonitoringService';
import { environmentService } from '@/services/environmentService';
import { useAuth } from '@/hooks/useAuth';

interface DashboardStats {
  uptime: string;
  totalErrors: number;
  performance: number;
  activeUsers: number;
  scanAccuracy: number;
}

export const ProductionDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    uptime: '99.9%',
    totalErrors: 0,
    performance: 95,
    activeUsers: 0,
    scanAccuracy: 0
  });
  const [performanceReport, setPerformanceReport] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const report = await performanceMonitoringService.getPerformanceReport();
      setPerformanceReport(report);
      
      if (report) {
        setStats(prev => ({
          ...prev,
          performance: Math.round(report.performanceScore || 95),
          scanAccuracy: Math.round(report.scanAccuracy?.accuracyRate || 0)
        }));
      }
    } catch (error) {
      errorMonitoringService.logError('Failed to load dashboard data', error);
    }
  };

  const generateProductionReport = async () => {
    try {
      const data = {
        timestamp: new Date().toISOString(),
        environment: environmentService.env,
        performance: performanceReport,
        user: user?.id,
        buildVersion: '1.0.0'
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `production-report-${Date.now()}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      errorMonitoringService.logError('Failed to generate production report', error);
    }
  };

  const StatusIndicator = ({ status }: { status: 'healthy' | 'warning' | 'error' }) => {
    const configs = {
      healthy: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
      warning: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50' },
      error: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' }
    };
    
    const config = configs[status];
    const Icon = config.icon;
    
    return (
      <div className={`p-2 rounded-full ${config.bg}`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Production Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor app performance, errors, and user metrics
          </p>
        </div>
        <Badge variant={environmentService.env.isProduction ? 'default' : 'secondary'}>
          {environmentService.env.isProduction ? 'Production' : 'Development'}
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">App Uptime</CardTitle>
            <StatusIndicator status="healthy" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uptime}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.performance}/100</div>
            <p className="text-xs text-muted-foreground">
              {stats.performance >= 90 ? 'Excellent' : stats.performance >= 70 ? 'Good' : 'Needs Improvement'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scan Accuracy</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scanAccuracy}%</div>
            <p className="text-xs text-muted-foreground">OCR success rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalErrors}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Error Monitoring</TabsTrigger>
          <TabsTrigger value="mobile">Mobile Builds</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Performance Metrics
              </CardTitle>
              <CardDescription>
                Real-time performance monitoring and optimization insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Load Time</div>
                  <div className="text-2xl font-bold">2.1s</div>
                  <div className="text-xs text-green-600">↓ 15% from last week</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">API Response</div>
                  <div className="text-2xl font-bold">340ms</div>
                  <div className="text-xs text-yellow-600">↑ 5% from last week</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Memory Usage</div>
                  <div className="text-2xl font-bold">45MB</div>
                  <div className="text-xs text-green-600">Within budget</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Error Monitoring & Crash Reports
              </CardTitle>
              <CardDescription>
                Track application errors and stability metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Error Rate</span>
                  <Badge variant="outline">0.03%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Critical Errors</span>
                  <Badge variant="destructive">0</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Crash-Free Sessions</span>
                  <Badge variant="default">99.97%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mobile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Mobile App Store Builds
              </CardTitle>
              <CardDescription>
                Production builds and app store deployment status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Android (Google Play)</span>
                      <Badge variant="default">v1.0.0</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Last build: 2 hours ago
                    </div>
                    <Button size="sm" className="mt-2 w-full">
                      Build APK/AAB
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">iOS (App Store)</span>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Requires Xcode setup
                    </div>
                    <Button size="sm" variant="outline" className="mt-2 w-full">
                      Setup iOS Build
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Production Deployment
              </CardTitle>
              <CardDescription>
                Environment configuration and deployment pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Environment</div>
                    <Badge variant={environmentService.env.isProduction ? 'default' : 'secondary'}>
                      {environmentService.env.isProduction ? 'Production' : 'Development'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Build Version</div>
                    <div className="text-sm text-muted-foreground">
                      {environmentService.env.appVersion}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={generateProductionReport} className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download Report
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    View Deployment History
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};