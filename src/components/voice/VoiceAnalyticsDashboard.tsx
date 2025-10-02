import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Activity, TrendingUp, Clock, DollarSign, 
  AlertTriangle, Calendar, Zap
} from 'lucide-react';

interface AnalyticsData {
  totalMinutes: number;
  totalSessions: number;
  avgSessionLength: number;
  estimatedCost: number;
  dailyUsage: { date: string; minutes: number }[];
  voiceDistribution: { voice: string; count: number }[];
}

interface VoiceAnalyticsDashboardProps {
  userId?: string;
  minutesUsed: number;
  minutesLimit: number;
}

export const VoiceAnalyticsDashboard: React.FC<VoiceAnalyticsDashboardProps> = ({ 
  userId, 
  minutesUsed,
  minutesLimit 
}) => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalMinutes: 0,
    totalSessions: 0,
    avgSessionLength: 0,
    estimatedCost: 0,
    dailyUsage: [],
    voiceDistribution: []
  });
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<'week' | 'month'>('month');

  useEffect(() => {
    if (userId) {
      loadAnalytics();
    }
  }, [userId, period]);

  const loadAnalytics = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (period === 'week' ? 7 : 30));

      // Query voice_conversation_analytics table
      const { data, error } = await supabase
        .from('voice_conversation_analytics')
        .select('*')
        .eq('user_id', userId)
        .gte('session_start', startDate.toISOString())
        .lte('session_start', endDate.toISOString())
        .order('session_start', { ascending: true });

      if (error) throw error;

      // Process analytics
      const totalMinutes = data?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;
      const totalSessions = data?.length || 0;
      const avgSessionLength = totalSessions > 0 ? totalMinutes / totalSessions : 0;
      
      // Rough cost estimate: $0.06 per minute for GPT-4o Realtime
      const estimatedCost = totalMinutes * 0.06;

      // Daily usage aggregation
      const dailyMap = new Map<string, number>();
      data?.forEach(session => {
        const date = new Date(session.session_start).toLocaleDateString();
        dailyMap.set(date, (dailyMap.get(date) || 0) + (session.duration_minutes || 0));
      });

      const dailyUsage = Array.from(dailyMap.entries())
        .map(([date, minutes]) => ({ date, minutes }))
        .slice(-14); // Last 14 days

      // Voice distribution
      const voiceMap = new Map<string, number>();
      data?.forEach(session => {
        const voice = session.voice_used || 'unknown';
        voiceMap.set(voice, (voiceMap.get(voice) || 0) + 1);
      });

      const voiceDistribution = Array.from(voiceMap.entries())
        .map(([voice, count]) => ({ voice, count }));

      setAnalytics({
        totalMinutes,
        totalSessions,
        avgSessionLength,
        estimatedCost,
        dailyUsage,
        voiceDistribution
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const usagePercentage = (minutesUsed / minutesLimit) * 100;
  const getWarningLevel = () => {
    if (usagePercentage >= 90) return { color: 'text-red-500', label: 'Critical', icon: AlertTriangle };
    if (usagePercentage >= 75) return { color: 'text-orange-500', label: 'High', icon: AlertTriangle };
    if (usagePercentage >= 50) return { color: 'text-yellow-500', label: 'Moderate', icon: TrendingUp };
    return { color: 'text-green-500', label: 'Normal', icon: Activity };
  };

  const warning = getWarningLevel();
  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Total Minutes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalMinutes.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              This {period === 'week' ? 'week' : 'month'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {analytics.avgSessionLength.toFixed(1)} min
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Est. Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.estimatedCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              ~$0.06 per minute
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <warning.icon className={`w-4 h-4 ${warning.color}`} />
              Usage Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className={`text-2xl font-bold ${warning.color}`}>
                {usagePercentage.toFixed(0)}%
              </div>
              <Badge variant={usagePercentage >= 75 ? 'destructive' : 'secondary'}>
                {warning.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {minutesUsed}/{minutesLimit} min used
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Usage Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Daily Usage Trend
            </CardTitle>
            <CardDescription>Minutes used per day</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.dailyUsage.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={analytics.dailyUsage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="minutes" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No usage data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Voice Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Voice Usage Distribution</CardTitle>
            <CardDescription>Sessions by voice</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.voiceDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={analytics.voiceDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ voice, count }) => `${voice}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analytics.voiceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No voice data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Warning Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Warnings</CardTitle>
          <CardDescription>Get notified at these thresholds</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">50% (Moderate)</span>
              <Badge variant={usagePercentage >= 50 ? 'default' : 'outline'}>
                {usagePercentage >= 50 ? '✓ Triggered' : 'Not reached'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">75% (High)</span>
              <Badge variant={usagePercentage >= 75 ? 'default' : 'outline'}>
                {usagePercentage >= 75 ? '✓ Triggered' : 'Not reached'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">90% (Critical)</span>
              <Badge variant={usagePercentage >= 90 ? 'destructive' : 'outline'}>
                {usagePercentage >= 90 ? '⚠️ Triggered' : 'Not reached'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
