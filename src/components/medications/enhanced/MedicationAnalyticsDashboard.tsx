import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Award, Calendar, Clock, Target, Zap, Shield, Heart } from 'lucide-react';
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle, MobileCardDescription } from '@/components/ui/mobile/MobileCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

interface MedicationAnalyticsDashboardProps {
  medications: any[];
  className?: string;
}

const MedicationAnalyticsDashboard: React.FC<MedicationAnalyticsDashboardProps> = ({
  medications,
  className
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('week');

  // Mock analytics data
  const adherenceData = [
    { name: 'Mon', adherence: 95, missed: 1, taken: 19 },
    { name: 'Tue', adherence: 88, missed: 2, taken: 18 },
    { name: 'Wed', adherence: 92, missed: 1, taken: 19 },
    { name: 'Thu', adherence: 85, missed: 3, taken: 17 },
    { name: 'Fri', adherence: 98, missed: 0, taken: 20 },
    { name: 'Sat', adherence: 90, missed: 2, taken: 18 },
    { name: 'Sun', adherence: 87, missed: 2, taken: 18 }
  ];

  const effectivenessData = [
    { medication: 'Lisinopril', effectiveness: 95, sideEffects: 10 },
    { medication: 'Metformin', effectiveness: 88, sideEffects: 25 },
    { medication: 'Atorvastatin', effectiveness: 92, sideEffects: 15 },
    { medication: 'Omeprazole', effectiveness: 85, sideEffects: 20 }
  ];

  const adherenceByCategory = [
    { name: 'Heart', value: 95, color: '#ef4444', count: 3 },
    { name: 'Diabetes', value: 88, color: '#3b82f6', count: 2 },
    { name: 'Cholesterol', value: 92, color: '#8b5cf6', count: 1 },
    { name: 'Digestive', value: 85, color: '#f59e0b', count: 2 }
  ];

  const timePreferences = [
    { time: '6:00 AM', medications: 4, adherence: 95 },
    { time: '12:00 PM', medications: 3, adherence: 88 },
    { time: '6:00 PM', medications: 5, adherence: 92 },
    { time: '9:00 PM', medications: 2, adherence: 90 }
  ];

  const insights = [
    {
      type: 'positive',
      icon: <Award className="w-5 h-5 text-green-600" />,
      title: 'Great Consistency!',
      description: 'You\'ve maintained 90%+ adherence for 2 weeks straight.',
      action: 'Keep it up!'
    },
    {
      type: 'warning',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      title: 'Evening Doses',
      description: 'You tend to miss evening medications more often.',
      action: 'Set a reminder for 8 PM'
    },
    {
      type: 'info',
      icon: <Heart className="w-5 h-5 text-blue-600" />,
      title: 'Effectiveness Tracking',
      description: 'Your blood pressure medications show excellent results.',
      action: 'Share with doctor'
    },
    {
      type: 'urgent',
      icon: <Shield className="w-5 h-5 text-red-600" />,
      title: 'Drug Interaction Alert',
      description: 'Potential interaction detected between Warfarin and Aspirin.',
      action: 'Consult pharmacist'
    }
  ];

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
                <div className="text-2xl font-bold text-primary mb-1">91.5%</div>
                <div className="text-sm text-muted-foreground">Average Adherence</div>
                <Progress value={91.5} className="h-1 mt-2" />
              </MobileCardContent>
            </MobileCard>

            <MobileCard variant="glass">
              <MobileCardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Zap className="w-8 h-8 text-amber-500" />
                  <Badge variant="outline" className="text-xs">14 days</Badge>
                </div>
                <div className="text-2xl font-bold text-primary mb-1">14</div>
                <div className="text-sm text-muted-foreground">Current Streak</div>
                <div className="flex gap-1 mt-2">
                  {Array.from({ length: 7 }).map((_, i) => (
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
                  <LineChart data={adherenceData}>
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
                        data={adherenceByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={50}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {adherenceByCategory.map((entry, index) => (
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
                  {timePreferences.map((time, index) => (
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
                  <BarChart data={adherenceData}>
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
                {effectivenessData.map((med, index) => (
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

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <MobileCard key={index} className={`border ${getInsightStyle(insight.type)}`}>
                <MobileCardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{insight.icon}</div>
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
    </div>
  );
};

export default MedicationAnalyticsDashboard;