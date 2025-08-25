import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Award, Calendar, Clock, Target, Zap, Shield, Heart } from 'lucide-react';
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle, MobileCardDescription } from '@/components/ui/mobile/MobileCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { medicationAnalyticsService } from '@/services/medicationAnalyticsService';
import { useAuth } from '@/hooks/useAuth';

interface MedicationAnalyticsDashboardProps {
  medications: any[];
  className?: string;
}

const MedicationAnalyticsDashboard: React.FC<MedicationAnalyticsDashboardProps> = ({
  medications,
  className
}) => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('week');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    adherenceData: [] as any[],
    effectivenessData: [] as any[],
    adherenceByCategory: [] as any[],
    timePreferences: [] as any[],
    insights: [] as any[],
    overallStats: { averageAdherence: 0, currentStreak: 0 }
  });

  // Load real analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const [adherenceData, effectivenessData, categoryData, timePrefs, insights, stats] = await Promise.all([
          medicationAnalyticsService.getWeeklyAdherence(user.id),
          medicationAnalyticsService.getMedicationEffectiveness(user.id),
          medicationAnalyticsService.getAdherenceByCategory(user.id),
          medicationAnalyticsService.getTimePreferences(user.id),
          medicationAnalyticsService.getMedicationInsights(user.id),
          medicationAnalyticsService.getOverallStats(user.id)
        ]);

        setAnalyticsData({
          adherenceData,
          effectivenessData,
          adherenceByCategory: categoryData,
          timePreferences: timePrefs,
          insights,
          overallStats: stats
        });
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [user, selectedPeriod]);

  const getInsightStyle = (type: string) => {
    switch (type) {
      case 'positive':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-amber-200 bg-amber-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      case 'urgent':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-border bg-background';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <Award className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'info':
        return <Heart className="w-5 h-5 text-blue-600" />;
      case 'urgent':
        return <Shield className="w-5 h-5 text-red-600" />;
      default:
        return <Award className="w-5 h-5 text-green-600" />;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Analytics & Insights</h2>
          <p className="text-sm text-muted-foreground">Track your medication journey</p>
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {(['week', 'month', 'quarter'] as const).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
              className="text-xs capitalize"
            >
              {period}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : (

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="adherence">Adherence</TabsTrigger>
          <TabsTrigger value="effectiveness">Effects</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <MobileCard variant="glass">
              <MobileCardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Target className="w-8 h-8 text-primary" />
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-primary mb-1">{analyticsData.overallStats.averageAdherence.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Average Adherence</div>
                <Progress value={analyticsData.overallStats.averageAdherence} className="h-1 mt-2" />
              </MobileCardContent>
            </MobileCard>

            <MobileCard variant="glass">
              <MobileCardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Zap className="w-8 h-8 text-amber-500" />
                  <Badge variant="outline" className="text-xs">14 days</Badge>
                </div>
                <div className="text-2xl font-bold text-primary mb-1">{analyticsData.overallStats.currentStreak}</div>
                <div className="text-sm text-muted-foreground">Current Streak</div>
                <div className="flex gap-1 mt-2">
                  {Array.from({ length: Math.min(7, analyticsData.overallStats.currentStreak) }).map((_, i) => (
                    <div key={i} className="h-1 flex-1 bg-amber-200 rounded" />
                  ))}
                </div>
              </MobileCardContent>
            </MobileCard>
          </div>

          {/* Weekly Adherence Chart */}
          <MobileCard variant="glass">
            <MobileCardHeader>
              <MobileCardTitle className="text-base">Weekly Adherence Trend</MobileCardTitle>
            </MobileCardHeader>
            <MobileCardContent className="p-4 pt-0">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.adherenceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="adherence" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                      activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </MobileCardContent>
          </MobileCard>
        </TabsContent>

        {/* Adherence Tab */}
        <TabsContent value="adherence" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Adherence by Category */}
            <MobileCard variant="glass">
              <MobileCardHeader>
                <MobileCardTitle className="text-base">By Category</MobileCardTitle>
              </MobileCardHeader>
              <MobileCardContent className="p-4 pt-0">
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.adherenceByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={50}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {analyticsData.adherenceByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </MobileCardContent>
            </MobileCard>

            {/* Time Preferences */}
            <MobileCard variant="glass">
              <MobileCardHeader>
                <MobileCardTitle className="text-base">Best Times</MobileCardTitle>
              </MobileCardHeader>
              <MobileCardContent className="p-4 pt-0">
                <div className="space-y-3">
                  {analyticsData.timePreferences.map((time, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{time.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{time.medications} meds</span>
                        <div className={`text-xs font-bold ${
                          time.adherence >= 90 ? 'text-green-600' : 
                          time.adherence >= 80 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {time.adherence}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </MobileCardContent>
            </MobileCard>
          </div>

          {/* Daily Breakdown */}
          <MobileCard variant="glass">
            <MobileCardHeader>
              <MobileCardTitle className="text-base">Daily Breakdown</MobileCardTitle>
            </MobileCardHeader>
            <MobileCardContent className="p-4 pt-0">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.adherenceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="taken" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="missed" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </MobileCardContent>
          </MobileCard>
        </TabsContent>

        {/* Effectiveness Tab */}
        <TabsContent value="effectiveness" className="space-y-4">
          <MobileCard variant="glass">
            <MobileCardHeader>
              <MobileCardTitle className="text-base">Medication Effectiveness</MobileCardTitle>
              <MobileCardDescription>Based on adherence and reported outcomes</MobileCardDescription>
            </MobileCardHeader>
            <MobileCardContent className="p-4 pt-0">
              <div className="space-y-4">
                {analyticsData.effectivenessData.map((med, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{med.medication}</span>
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold text-primary">{med.effectiveness}%</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1">Effectiveness</div>
                        <Progress value={med.effectiveness} className="h-2" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1">Side Effects</div>
                        <Progress 
                          value={med.sideEffects} 
                          className="h-2" 
                          // Use a red color for side effects
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </MobileCardContent>
          </MobileCard>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="space-y-3">
            {analyticsData.insights.map((insight, index) => (
              <MobileCard key={index} className={`border ${getInsightStyle(insight.type)}`}>
                <MobileCardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getInsightIcon(insight.type)}</div>
                    <div className="flex-1">
                      <div className="font-medium text-sm mb-1">{insight.title}</div>
                      <div className="text-sm text-muted-foreground mb-2">{insight.description}</div>
                      <Button variant="outline" size="sm" className="text-xs">
                        {insight.action}
                      </Button>
                    </div>
                  </div>
                </MobileCardContent>
              </MobileCard>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
};

export default MedicationAnalyticsDashboard;