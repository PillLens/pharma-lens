import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  TrendingUp, TrendingDown, Users, Clock, Pill, 
  Heart, AlertTriangle, Calendar, Activity, Target,
  BarChart3, PieChart, LineChart, Download, Filter
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts';

interface FamilyAnalyticsDashboardProps {
  familyGroupId: string;
}

interface AnalyticsData {
  overview: {
    totalMembers: number;
    adherenceRate: number;
    missedDosesWeek: number;
    upcomingAppointments: number;
    activeMedications: number;
    emergencyContacts: number;
  };
  trends: {
    adherenceOverTime: Array<{ date: string; adherence: number; missed: number }>;
    medicationsByMember: Array<{ member: string; count: number; adherence: number }>;
    activityByType: Array<{ type: string; count: number; color: string }>;
  };
  insights: Array<{
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    description: string;
    action?: string;
  }>;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

export const FamilyAnalyticsDashboard: React.FC<FamilyAnalyticsDashboardProps> = ({
  familyGroupId
}) => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('week');

  useEffect(() => {
    if (familyGroupId) {
      loadAnalytics();
    }
  }, [familyGroupId, timeframe]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(now.getMonth() - 3);
          break;
      }

      // Load family members
      const { data: members, error: membersError } = await supabase
        .from('family_members')
        .select(`
          user_id,
          role,
          profiles!inner(display_name)
        `)
        .eq('family_group_id', familyGroupId)
        .eq('invitation_status', 'accepted');

      if (membersError) throw membersError;

      const memberIds = members?.map(m => m.user_id) || [];

      // Load medication adherence data
      const { data: adherenceData, error: adherenceError } = await supabase
        .from('medication_adherence_log')
        .select('*')
        .in('user_id', memberIds)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (adherenceError) throw adherenceError;

      // Load active medications
      const { data: medications, error: medicationsError } = await supabase
        .from('user_medications')
        .select('*')
        .in('user_id', memberIds)
        .eq('is_active', true);

      if (medicationsError) throw medicationsError;

      // Load appointments
      const { data: appointments, error: appointmentsError } = await supabase
        .from('family_appointments')
        .select('*')
        .eq('family_group_id', familyGroupId)
        .gte('appointment_date', now.toISOString())
        .lte('appointment_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());

      if (appointmentsError) throw appointmentsError;

      // Load emergency contacts
      const { data: emergencyContacts, error: emergencyError } = await supabase
        .from('emergency_contacts')
        .select('*')
        .in('user_id', memberIds)
        .eq('is_active', true);

      if (emergencyError) throw emergencyError;

      // Load family activities
      const { data: activities, error: activitiesError } = await supabase
        .from('family_activity_log')
        .select('*')
        .eq('family_group_id', familyGroupId)
        .gte('created_at', startDate.toISOString());

      if (activitiesError) throw activitiesError;

      // Process data for analytics
      const processedAnalytics = processAnalyticsData({
        members: members || [],
        adherenceData: adherenceData || [],
        medications: medications || [],
        appointments: appointments || [],
        emergencyContacts: emergencyContacts || [],
        activities: activities || [],
        timeframe,
        startDate
      });

      setAnalytics(processedAnalytics);
      
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (data: any): AnalyticsData => {
    const { members, adherenceData, medications, appointments, emergencyContacts, activities } = data;

    // Calculate adherence rate
    const totalDoses = adherenceData.length;
    const takenDoses = adherenceData.filter((log: any) => log.status === 'taken').length;
    const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

    // Calculate missed doses this week
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const missedDosesWeek = adherenceData.filter((log: any) => 
      log.status === 'missed' && new Date(log.created_at) >= weekAgo
    ).length;

    // Group adherence by date
    const adherenceByDate = adherenceData.reduce((acc: any, log: any) => {
      const date = new Date(log.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { total: 0, taken: 0 };
      }
      acc[date].total++;
      if (log.status === 'taken') {
        acc[date].taken++;
      }
      return acc;
    }, {});

    const adherenceOverTime = Object.entries(adherenceByDate).map(([date, stats]: [string, any]) => ({
      date: new Date(date).toLocaleDateString(),
      adherence: Math.round((stats.taken / stats.total) * 100),
      missed: stats.total - stats.taken
    }));

    // Group medications by member
    const medicationsByMember = members.map((member: any) => {
      const memberMeds = medications.filter((med: any) => med.user_id === member.user_id);
      const memberAdherence = adherenceData.filter((log: any) => log.user_id === member.user_id);
      const memberAdherenceRate = memberAdherence.length > 0 
        ? Math.round((memberAdherence.filter((log: any) => log.status === 'taken').length / memberAdherence.length) * 100)
        : 100;

      return {
        member: member.profiles.display_name || 'Unknown',
        count: memberMeds.length,
        adherence: memberAdherenceRate
      };
    });

    // Group activities by type
    const activityCounts = activities.reduce((acc: any, activity: any) => {
      acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1;
      return acc;
    }, {});

    const activityByType = Object.entries(activityCounts).map(([type, count], index) => ({
      type: type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      count: count as number,
      color: COLORS[index % COLORS.length]
    }));

    // Generate insights
    const insights = [];

    if (adherenceRate >= 90) {
      insights.push({
        type: 'success' as const,
        title: 'Excellent Medication Adherence',
        description: `Your family maintains a ${adherenceRate}% adherence rate - keep up the great work!`,
      });
    } else if (adherenceRate < 70) {
      insights.push({
        type: 'warning' as const,
        title: 'Medication Adherence Needs Attention',
        description: `Adherence rate is ${adherenceRate}%. Consider setting up additional reminders.`,
        action: 'Set up reminders'
      });
    }

    if (emergencyContacts.length < members.length * 2) {
      insights.push({
        type: 'info' as const,
        title: 'Emergency Preparedness',
        description: 'Consider adding more emergency contacts for better family safety coverage.',
        action: 'Add contacts'
      });
    }

    if (appointments.length > 0) {
      insights.push({
        type: 'info' as const,
        title: `${appointments.length} Upcoming Appointments`,
        description: 'Don\'t forget about your scheduled healthcare appointments.',
        action: 'View calendar'
      });
    }

    return {
      overview: {
        totalMembers: members.length,
        adherenceRate,
        missedDosesWeek,
        upcomingAppointments: appointments.length,
        activeMedications: medications.length,
        emergencyContacts: emergencyContacts.length
      },
      trends: {
        adherenceOverTime,
        medicationsByMember,
        activityByType
      },
      insights
    };
  };

  const exportReport = async () => {
    try {
      // Generate CSV report
      const reportData = {
        familyGroupId,
        generatedAt: new Date().toISOString(),
        timeframe,
        analytics
      };

      const csvContent = generateCSVReport(reportData);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `family-analytics-${familyGroupId}-${timeframe}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Analytics report exported');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const generateCSVReport = (data: any): string => {
    const { analytics } = data;
    
    let csv = 'Family Analytics Report\n\n';
    csv += 'Overview\n';
    csv += 'Metric,Value\n';
    csv += `Total Members,${analytics.overview.totalMembers}\n`;
    csv += `Adherence Rate,${analytics.overview.adherenceRate}%\n`;
    csv += `Missed Doses (Week),${analytics.overview.missedDosesWeek}\n`;
    csv += `Upcoming Appointments,${analytics.overview.upcomingAppointments}\n`;
    csv += `Active Medications,${analytics.overview.activeMedications}\n`;
    csv += `Emergency Contacts,${analytics.overview.emergencyContacts}\n\n`;

    csv += 'Adherence Over Time\n';
    csv += 'Date,Adherence Rate,Missed Doses\n';
    analytics.trends.adherenceOverTime.forEach((item: any) => {
      csv += `${item.date},${item.adherence}%,${item.missed}\n`;
    });

    return csv;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Family Analytics Dashboard
            </div>
            <div className="flex items-center gap-2">
              <select 
                value={timeframe} 
                onChange={(e) => setTimeframe(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="3months">Last 3 Months</option>
              </select>
              <Button onClick={exportReport} size="sm" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{analytics.overview.totalMembers}</p>
            <p className="text-xs text-muted-foreground">Family Members</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{analytics.overview.adherenceRate}%</p>
            <p className="text-xs text-muted-foreground">Adherence Rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold">{analytics.overview.missedDosesWeek}</p>
            <p className="text-xs text-muted-foreground">Missed This Week</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{analytics.overview.upcomingAppointments}</p>
            <p className="text-xs text-muted-foreground">Upcoming Appts</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Pill className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{analytics.overview.activeMedications}</p>
            <p className="text-xs text-muted-foreground">Active Medications</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <p className="text-2xl font-bold">{analytics.overview.emergencyContacts}</p>
            <p className="text-xs text-muted-foreground">Emergency Contacts</p>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {analytics.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.insights.map((insight, index) => (
              <div key={index} className={`p-3 rounded-lg border-l-4 ${
                insight.type === 'success' ? 'border-l-green-500 bg-green-50' :
                insight.type === 'warning' ? 'border-l-orange-500 bg-orange-50' :
                insight.type === 'error' ? 'border-l-red-500 bg-red-50' :
                'border-l-blue-500 bg-blue-50'
              }`}>
                <h4 className="font-medium">{insight.title}</h4>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
                {insight.action && (
                  <Button size="sm" variant="outline" className="mt-2">
                    {insight.action}
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <Tabs defaultValue="adherence" className="space-y-4">
        <TabsList>
          <TabsTrigger value="adherence">Adherence Trends</TabsTrigger>
          <TabsTrigger value="medications">Medications by Member</TabsTrigger>
          <TabsTrigger value="activity">Family Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="adherence">
          <Card>
            <CardHeader>
              <CardTitle>Medication Adherence Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={analytics.trends.adherenceOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="adherence" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Adherence Rate (%)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="missed" 
                    stroke="#ff7c7c" 
                    strokeWidth={2}
                    name="Missed Doses"
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medications">
          <Card>
            <CardHeader>
              <CardTitle>Medications by Family Member</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.trends.medicationsByMember}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="member" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" name="Medication Count" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Family Activity Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Tooltip />
                  <RechartsPieChart data={analytics.trends.activityByType}>
                    {analytics.trends.activityByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </RechartsPieChart>
                </RechartsPieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
                {analytics.trends.activityByType.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.type}: {item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};