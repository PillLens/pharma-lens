import React, { useState, useEffect } from 'react';
import { Heart, Shield, Activity, Users, Clock, Zap, TrendingUp, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTranslation } from '@/hooks/useTranslation';
import { familyAnalyticsService, FamilyHealthMetrics, FamilyActivityEvent } from '@/services/familyAnalyticsService';
import { QuickStatsGrid } from '@/components/ui/QuickStatsGrid';

interface EnhancedFamilyDashboardProps {
  familyGroups: any[];
  onQuickAction?: (action: string) => void;
}

const EnhancedFamilyDashboard: React.FC<EnhancedFamilyDashboardProps> = ({
  familyGroups,
  onQuickAction
}) => {
  const { t } = useTranslation();
  const [healthMetrics, setHealthMetrics] = useState<FamilyHealthMetrics | null>(null);
  const [adherenceData, setAdherenceData] = useState<any[]>([]);
  const [medicationDistribution, setMedicationDistribution] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<FamilyActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Load real family health metrics
        const metrics = await familyAnalyticsService.getFamilyHealthMetrics(familyGroups);
        setHealthMetrics(metrics);

        // Load real adherence data for the week
        const adherence = await familyAnalyticsService.getFamilyAdherenceData(familyGroups, 7);
        const formattedAdherence = adherence.map((day, index) => ({
          day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index] || day.date.split('-')[2],
          adherence: day.familyAverage
        }));
        setAdherenceData(formattedAdherence);

        // Load real medication status distribution
        const distribution = await familyAnalyticsService.getMedicationStatusDistribution(familyGroups);
        setMedicationDistribution([
          { name: t('family.dashboard.onTime'), value: distribution.onTime, color: 'hsl(var(--success))' },
          { name: t('family.dashboard.delayed'), value: distribution.delayed, color: 'hsl(var(--warning))' },
          { name: t('family.dashboard.missed'), value: distribution.missed, color: 'hsl(var(--destructive))' }
        ]);

        // Load recent family activity
        const activity = await familyAnalyticsService.getFamilyActivityEvents(familyGroups, 3);
        setRecentActivity(activity);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (familyGroups.length > 0) {
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [familyGroups]);

  // Use actual family group data for accurate member counts
  const totalMembers = familyGroups.reduce((sum, group) => sum + (group.members?.length || 0), 0);
  const activeMembers = familyGroups.reduce((sum, group) => 
    sum + (group.members?.filter(m => m.invitation_status === 'accepted').length || 0), 0);
  
  console.log('Dashboard calculation:', {
    healthMetrics,
    familyGroups: familyGroups.map(g => ({
      id: g.id,
      name: g.name,
      member_count: g.member_count,
      members_length: g.members?.length,
      accepted_members: g.members?.filter(m => m.invitation_status === 'accepted').length
    })),
    calculatedTotalMembers: totalMembers,
    calculatedActiveMembers: activeMembers
  });

  const overallAdherence = healthMetrics?.overallAdherence || 0;
  const pendingTasks = healthMetrics?.pendingTasks || 0;
  const careScore = healthMetrics?.careScore || 'N/A';

  // Prepare stats data for QuickStatsGrid
  const familyStats = [
    {
      icon: Users,
      value: activeMembers,
      label: t('family.dashboard.familyMembers') || 'Family Members',
      translationKey: 'family.dashboard.familyMembers',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20'
    },
    {
      icon: TrendingUp,
      value: `${overallAdherence}%`,
      label: t('family.dashboard.adherenceRate') || 'Adherence Rate',
      translationKey: 'family.dashboard.adherenceRate',
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/20'
    },
    {
      icon: Clock,
      value: pendingTasks,
      label: t('family.dashboard.pendingTasks') || 'Pending Tasks',
      translationKey: 'family.dashboard.pendingTasks',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/20'
    },
    {
      icon: Shield,
      value: careScore,
      label: t('family.dashboard.careScore') || 'Care Score',
      translationKey: 'family.dashboard.careScore',
      color: 'text-info',
      bgColor: 'bg-info/10',
      borderColor: 'border-info/20'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats Overview */}
      <QuickStatsGrid stats={familyStats} className="mb-6" />

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 hover:shadow-lg transition-all cursor-pointer" onClick={() => onQuickAction?.('medications')}>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/20 flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-primary mb-1">{t('family.dashboard.shareMedications')}</h3>
            <p className="text-xs text-muted-foreground">{t('family.dashboard.shareDescription')}</p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-blue-500/10 hover:shadow-lg transition-all cursor-pointer" onClick={() => onQuickAction?.('checkup')}>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-blue-600 mb-1">{t('family.dashboard.dailyCheckup')}</h3>
            <p className="text-xs text-muted-foreground">{t('family.dashboard.checkupDescription')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Adherence Trend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              {t('family.dashboard.weeklyTrend')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={adherenceData}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} className="text-xs" />
                  <YAxis hide />
                  <Line 
                    type="monotone" 
                    dataKey="adherence" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>Average: {Math.round(adherenceData.reduce((sum, day) => sum + day.adherence, 0) / Math.max(adherenceData.length, 1))}%</span>
              <Badge className="bg-success/10 text-success">
                {overallAdherence >= 85 ? '+' : ''}{overallAdherence >= 85 ? '2.3' : '-1.2'}% {t('family.dashboard.vsLastWeek')}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Medication Status Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              {t('family.dashboard.medicationStatus')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={medicationDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={50}
                    dataKey="value"
                  >
                    {medicationDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {medicationDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Alerts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            {t('family.dashboard.recentActivity')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                  <div className="w-16 h-6 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('family.dashboard.noRecentActivity')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'completed' ? 'bg-success animate-pulse' :
                    activity.status === 'pending' ? 'bg-warning animate-pulse' :
                    'bg-blue-500 animate-pulse'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  <Badge className={`text-xs ${
                    activity.status === 'completed' ? 'bg-success/10 text-success' :
                    activity.status === 'pending' ? 'bg-warning/10 text-warning' :
                    'bg-blue-500/10 text-blue-600'
                  }`}>
                    {activity.status === 'completed' ? t('family.dashboard.completed') :
                     activity.status === 'pending' ? t('family.status.pending') : t('family.dashboard.activeStatus')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedFamilyDashboard;