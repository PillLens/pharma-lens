import React from 'react';
import { Bell, Pill, Calendar, TrendingUp, TrendingDown, Target, Award, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useTranslation } from '@/hooks/useTranslation';

interface EnhancedSummaryDashboardProps {
  activeReminders: number;
  medicationsCovered: number;
  todaysDoses: number;
  adherenceRate: number;
  streak: number;
  missedDoses: number;
  weeklyAdherence: Array<{ day: string; rate: number }>;
  todaySchedule?: Array<{
    time: string;
    medication: string;
    status: 'upcoming' | 'current' | 'taken' | 'missed' | 'overdue';
  }>;
  onCardTap?: (type: string) => void;
}

const EnhancedSummaryDashboard: React.FC<EnhancedSummaryDashboardProps> = ({
  activeReminders,
  medicationsCovered,
  todaysDoses,
  adherenceRate,
  streak,
  missedDoses,
  weeklyAdherence,
  todaySchedule = [],
  onCardTap
}) => {
  const { t } = useTranslation();

  const pieData = [
    { name: 'Taken', value: adherenceRate, color: 'hsl(var(--success))' },
    { name: 'Missed', value: 100 - adherenceRate, color: 'hsl(var(--muted))' }
  ];

  const quickStats = [
    {
      id: 'active',
      title: t('reminders.summary.active'),
      value: activeReminders,
      icon: Bell,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'medications',
      title: t('reminders.summary.medications'),
      value: medicationsCovered,
      icon: Pill,
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'today',
      title: t('reminders.summary.todayDoses'),
      value: todaysDoses,
      icon: Calendar,
      color: 'from-amber-500 to-amber-600'
    },
    {
      id: 'streak',
      title: t('reminders.summary.dayStreak'),
      value: streak,
      icon: Award,
      color: 'from-purple-500 to-purple-600'
    }
  ];

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3 text-success" />;
      case 'down': return <TrendingDown className="w-3 h-3 text-destructive" />;
      default: return <div className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3 px-4">
        {quickStats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card
              key={stat.id}
              className="rounded-3xl border-0 bg-gradient-to-br from-card to-primary/5 shadow-sm cursor-pointer transition-all duration-300 hover:shadow-lg active:scale-[0.98]"
              onClick={() => onCardTap?.(stat.id)}
            >
              <CardContent className="p-2">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-md`}>
                      <IconComponent className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-xl font-bold text-foreground">{stat.value}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground font-medium leading-tight">
                      {stat.title}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Adherence Overview */}
      <div className="px-4">
        <Card className="rounded-3xl border-0 bg-gradient-to-br from-card to-success/5 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">{t('reminders.summary.adherenceOverview')}</h3>
                <p className="text-sm text-muted-foreground">{t('reminders.summary.medicationCompliance')}</p>
              </div>
              <Badge 
                variant={adherenceRate >= 80 ? "default" : "destructive"} 
                className="px-3 py-1 rounded-full font-semibold"
              >
                {adherenceRate >= 80 ? t('reminders.summary.great') : t('reminders.summary.needsAttention')}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Circular Progress */}
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="relative w-24 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={48}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg font-bold text-foreground">{adherenceRate}%</div>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-center">{t('reminders.summary.thisWeek')}</div>
              </div>
              
              {/* Stats */}
              <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-success" />
                      <span className="text-sm text-muted-foreground">{t('reminders.summary.taken')}</span>
                    </div>
                    <span className="font-semibold text-foreground">{Math.round(todaysDoses * adherenceRate / 100)}/{todaysDoses}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-warning" />
                      <span className="text-sm text-muted-foreground">{t('reminders.summary.missed')}</span>
                    </div>
                    <span className="font-semibold text-warning">{missedDoses}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-muted-foreground">{t('reminders.summary.streak')}</span>
                    </div>
                    <span className="font-semibold text-foreground">{streak} {t('reminders.summary.days')}</span>
                  </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend */}
      <div className="px-4">
        <Card className="rounded-3xl border-0 bg-gradient-to-br from-card to-info/5 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-foreground mb-1">{t('reminders.summary.weeklyTrend')}</h3>
              <p className="text-sm text-muted-foreground">{t('reminders.summary.adherenceRateWeek')}</p>
            </div>
            
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyAdherence}>
                  <XAxis 
                    dataKey="day" 
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis hide />
                  <Bar 
                    dataKey="rate" 
                    radius={[4, 4, 0, 0]}
                    fill="hsl(var(--primary))"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Timeline Preview */}
      <div className="px-4">
        <Card className="rounded-3xl border-0 bg-gradient-to-br from-card to-warning/5 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">{t('reminders.timeline.todaysSchedule')}</h3>
                <p className="text-sm text-muted-foreground">{t('reminders.timeline.upcomingMedicationTimes')}</p>
              </div>
              <Clock className="w-5 h-5 text-primary" />
            </div>
            
            <div className="space-y-3">
              {todaySchedule.length > 0 ? (
                todaySchedule.map((item, index) => {
                  const currentTime = new Date().toTimeString().slice(0, 5);
                  const isPast = item.status === 'taken';
                  const isCurrent = item.status === 'current';
                  
                  return (
                    <div key={`${item.time}-${index}`} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        isPast ? 'bg-success' : 
                        isCurrent ? 'bg-primary animate-pulse' : 
                        item.status === 'missed' || item.status === 'overdue' ? 'bg-destructive' :
                        'bg-muted'
                      }`} />
                      <div className="flex-1 flex items-center justify-between">
                        <div>
                          <span className={`font-medium ${
                            isPast ? 'text-success' : 
                            isCurrent ? 'text-primary' : 
                            item.status === 'missed' || item.status === 'overdue' ? 'text-destructive' :
                            'text-foreground'
                          }`}>
                            {item.time}
                          </span>
                          <div className="text-xs text-muted-foreground">{item.medication}</div>
                        </div>
                        <Badge 
                          variant={
                            isPast ? "default" : 
                            item.status === 'missed' || item.status === 'overdue' ? "destructive" :
                            "outline"
                          } 
                          className="text-xs capitalize"
                        >
                          {t(`reminders.timeline.${item.status}`)}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('reminders.timeline.noRemindersToday')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedSummaryDashboard;