import React from 'react';
import { TrendingUp, TrendingDown, Minus, Award, Target, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle, MobileCardDescription } from '@/components/ui/mobile/MobileCard';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

interface EnhancedMedicationStatsCardProps {
  totalMedications: number;
  activeMedications: number;
  adherenceRate: number;
  currentStreak: number;
  expiringSoon: number;
  weeklyAdherence: number[];
  complianceScore: number;
  className?: string;
}

const EnhancedMedicationStatsCard: React.FC<EnhancedMedicationStatsCardProps> = ({
  totalMedications,
  activeMedications,
  adherenceRate,
  currentStreak,
  expiringSoon,
  weeklyAdherence,
  complianceScore,
  className
}) => {
  // Pie chart data for adherence
  const adherenceData = [
    { name: 'Taken', value: adherenceRate, color: '#10b981' },
    { name: 'Missed', value: 100 - adherenceRate, color: '#ef4444' }
  ];

  // Weekly trend data
  const weeklyData = weeklyAdherence.map((rate, index) => ({
    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index],
    adherence: rate
  }));

  // Calculate trend
  const recentTrend = weeklyAdherence.slice(-3);
  const isImproving = recentTrend[2] > recentTrend[0];
  const isStable = Math.abs(recentTrend[2] - recentTrend[0]) < 5;

  const getTrendIcon = () => {
    if (isStable) return <Minus className="w-4 h-4 text-muted-foreground" />;
    return isImproving ? 
      <TrendingUp className="w-4 h-4 text-green-500" /> : 
      <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 75) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getStreakBadgeVariant = (streak: number) => {
    if (streak >= 30) return 'default';
    if (streak >= 14) return 'secondary';
    return 'outline';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        {/* Total Medications */}
        <MobileCard variant="medical" className="text-center">
          <MobileCardContent className="p-4">
            <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <MobileCardTitle className="text-xl font-bold text-primary mb-1">
              {totalMedications}
            </MobileCardTitle>
            <MobileCardDescription className="text-xs">Total Meds</MobileCardDescription>
          </MobileCardContent>
        </MobileCard>

        {/* Active Medications */}
        <MobileCard variant="medical" className="text-center">
          <MobileCardContent className="p-4">
            <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <MobileCardTitle className="text-xl font-bold text-primary mb-1">
              {activeMedications}
            </MobileCardTitle>
            <MobileCardDescription className="text-xs">Active</MobileCardDescription>
          </MobileCardContent>
        </MobileCard>

        {/* Current Streak */}
        <MobileCard variant="medical" className="text-center">
          <MobileCardContent className="p-4">
            <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
            <MobileCardTitle className="text-xl font-bold text-primary mb-1">
              {currentStreak}
            </MobileCardTitle>
            <MobileCardDescription className="text-xs">Day Streak</MobileCardDescription>
          </MobileCardContent>
        </MobileCard>

        {/* Expiring Soon */}
        <MobileCard variant="medical" className="text-center">
          <MobileCardContent className="p-4">
            <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <MobileCardTitle className="text-xl font-bold text-primary mb-1">
              {expiringSoon}
            </MobileCardTitle>
            <MobileCardDescription className="text-xs">Expiring</MobileCardDescription>
          </MobileCardContent>
        </MobileCard>
      </div>

      {/* Adherence & Compliance Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Adherence Chart */}
        <MobileCard variant="glass" className="h-40">
          <MobileCardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <MobileCardTitle className="text-sm font-semibold">Daily Adherence</MobileCardTitle>
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                <span className={`text-xs font-medium ${isImproving ? 'text-green-600' : isStable ? 'text-muted-foreground' : 'text-red-600'}`}>
                  {Math.abs(recentTrend[2] - recentTrend[0]).toFixed(1)}%
                </span>
              </div>
            </div>
          </MobileCardHeader>
          <MobileCardContent className="p-3 pt-0">
            <div className="relative h-20">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={adherenceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={20}
                    outerRadius={35}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {adherenceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">{adherenceRate}%</span>
              </div>
            </div>
          </MobileCardContent>
        </MobileCard>

        {/* Compliance Score */}
        <MobileCard variant="glass">
          <MobileCardHeader className="pb-2">
            <MobileCardTitle className="text-sm font-semibold">Compliance Score</MobileCardTitle>
          </MobileCardHeader>
          <MobileCardContent className="p-3 pt-0">
            <div className="text-center mb-3">
              <div className="text-2xl font-bold mb-1">
                <span className={getComplianceColor(complianceScore).split(' ')[0]}>{complianceScore}</span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
              <Badge variant="outline" className={`text-xs ${getComplianceColor(complianceScore)}`}>
                {complianceScore >= 90 ? 'Excellent' : complianceScore >= 75 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </div>
            <Progress value={complianceScore} className="h-2" />
          </MobileCardContent>
        </MobileCard>
      </div>

      {/* Weekly Trend Chart */}
      <MobileCard variant="glass">
        <MobileCardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <MobileCardTitle className="text-sm font-semibold">Weekly Adherence Trend</MobileCardTitle>
            <Badge variant={getStreakBadgeVariant(currentStreak)} className="text-xs">
              <Award className="w-3 h-3 mr-1" />
              {currentStreak} days
            </Badge>
          </div>
        </MobileCardHeader>
        <MobileCardContent className="p-3 pt-0">
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis hide />
                <Line 
                  type="monotone" 
                  dataKey="adherence" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                  activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </MobileCardContent>
      </MobileCard>
    </div>
  );
};

export default EnhancedMedicationStatsCard;