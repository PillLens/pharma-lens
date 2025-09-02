import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  TrendingUp, TrendingDown, Activity, Users, Heart, Pill,
  Calendar, Clock, Target, AlertCircle, CheckCircle,
  BarChart3, PieChart, LineChart, Download, Share, Filter
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { advancedAnalyticsService } from '@/services/advancedAnalyticsService';

interface AdvancedAnalyticsDashboardProps {
  familyGroups: any[];
  currentUserId: string;
}

interface AnalyticsData {
  adherenceMetrics: {
    overall_rate: number;
    trend: 'up' | 'down' | 'stable';
    weekly_data: Array<{ date: string; rate: number }>;
    by_medication: Array<{ name: string; rate: number; count: number }>;
  };
  familyInsights: {
    active_members: number;
    total_interactions: number;
    emergency_alerts: number;
    completed_tasks: number;
    engagement_scores: Array<{ member: string; score: number; avatar?: string }>;
  };
  healthTrends: {
    missed_doses: Array<{ date: string; count: number }>;
    appointment_adherence: number;
    symptom_reports: number;
    medication_changes: number;
  };
  performanceMetrics: {
    app_usage: Array<{ date: string; sessions: number; duration: number }>;
    feature_adoption: Array<{ feature: string; usage: number; growth: number }>;
    user_satisfaction: number;
    error_rate: number;
  };
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];

export const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({
  familyGroups,
  currentUserId
}) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedGroup, setSelectedGroup] = useState('all');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange, selectedGroup]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const groupIds = selectedGroup === 'all' 
        ? familyGroups.map(g => g.id)
        : [selectedGroup];

      const data = await advancedAnalyticsService.getComprehensiveAnalytics({
        user_id: currentUserId,
        family_group_ids: groupIds,
        time_range: timeRange
      });

      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'csv') => {
    try {
      const report = await advancedAnalyticsService.generateReport({
        user_id: currentUserId,
        family_group_ids: selectedGroup === 'all' 
          ? familyGroups.map(g => g.id)
          : [selectedGroup],
        time_range: timeRange,
        format
      });

      // Trigger download
      const blob = new Blob([report.data], { 
        type: format === 'pdf' ? 'application/pdf' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `health-analytics-${timeRange}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const shareInsights = async () => {
    try {
      const insights = await advancedAnalyticsService.generateInsightsSummary({
        user_id: currentUserId,
        family_group_ids: selectedGroup === 'all' 
          ? familyGroups.map(g => g.id)
          : [selectedGroup],
        time_range: timeRange
      });

      if (navigator.share) {
        await navigator.share({
          title: 'Health Analytics Insights',
          text: insights.summary,
          url: window.location.href
        });
      } else {
        navigator.clipboard.writeText(insights.summary);
        toast.success('Insights copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing insights:', error);
      toast.error('Failed to share insights');
    }
  };

  if (loading || !analyticsData) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Health Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into family health patterns
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {familyGroups.map(group => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => exportReport('pdf')}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>

          <Button variant="outline" onClick={shareInsights}>
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Adherence Rate</p>
                <p className="text-2xl font-bold">{analyticsData.adherenceMetrics.overall_rate}%</p>
              </div>
              <div className="flex items-center gap-1">
                {analyticsData.adherenceMetrics.trend === 'up' && (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                )}
                {analyticsData.adherenceMetrics.trend === 'down' && (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <Pill className="w-8 h-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Members</p>
                <p className="text-2xl font-bold">{analyticsData.familyInsights.active_members}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Tasks</p>
                <p className="text-2xl font-bold">{analyticsData.familyInsights.completed_tasks}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emergency Alerts</p>
                <p className="text-2xl font-bold">{analyticsData.familyInsights.emergency_alerts}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="adherence">Adherence</TabsTrigger>
          <TabsTrigger value="family">Family</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Adherence Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5" />
                  Adherence Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={analyticsData.adherenceMetrics.weekly_data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ fill: '#8884d8' }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Engagement Scores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Family Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={analyticsData.familyInsights.engagement_scores}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="member" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="score" fill="#82ca9d" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="adherence" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Medication Adherence */}
            <Card>
              <CardHeader>
                <CardTitle>Adherence by Medication</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.adherenceMetrics.by_medication.map((med, index) => (
                    <div key={med.name} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{med.name}</p>
                        <div className="w-full bg-muted rounded-full h-2 mt-1">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${med.rate}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <Badge variant={med.rate >= 80 ? "default" : "secondary"}>
                          {med.rate}%
                        </Badge>
                        <p className="text-xs text-muted-foreground">{med.count} doses</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Missed Doses Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Missed Doses Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={analyticsData.healthTrends.missed_doses}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#ff7300" 
                      strokeWidth={2}
                      dot={{ fill: '#ff7300' }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="family" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Family Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Family Activity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: 'Messages', value: analyticsData.familyInsights.total_interactions },
                        { name: 'Tasks', value: analyticsData.familyInsights.completed_tasks },
                        { name: 'Alerts', value: analyticsData.familyInsights.emergency_alerts },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[0, 1, 2].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Member Engagement */}
            <Card>
              <CardHeader>
                <CardTitle>Member Engagement Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.familyInsights.engagement_scores.map((member, index) => (
                    <div key={member.member} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                        {member.member.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{member.member}</p>
                        <div className="w-full bg-muted rounded-full h-2 mt-1">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${member.score}%` }}
                          ></div>
                        </div>
                      </div>
                      <Badge variant={member.score >= 70 ? "default" : "secondary"}>
                        {member.score}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* App Usage */}
            <Card>
              <CardHeader>
                <CardTitle>App Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={analyticsData.performanceMetrics.app_usage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="sessions" 
                      stroke="#8884d8" 
                      name="Sessions"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="duration" 
                      stroke="#82ca9d" 
                      name="Duration (min)"
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Feature Adoption */}
            <Card>
              <CardHeader>
                <CardTitle>Feature Adoption</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.performanceMetrics.feature_adoption.map((feature, index) => (
                    <div key={feature.feature} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{feature.feature}</p>
                        <div className="w-full bg-muted rounded-full h-2 mt-1">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${feature.usage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <Badge variant="outline">
                          {feature.usage}%
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {feature.growth > 0 ? '+' : ''}{feature.growth}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Health */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">User Satisfaction</span>
                    <Badge variant="default">
                      {analyticsData.performanceMetrics.user_satisfaction}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Error Rate</span>
                    <Badge variant={analyticsData.performanceMetrics.error_rate < 1 ? "default" : "destructive"}>
                      {analyticsData.performanceMetrics.error_rate}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};