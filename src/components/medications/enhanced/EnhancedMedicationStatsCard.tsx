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

  const statsData = [
    {
      icon: Target,
      value: activeMedications,
      label: 'Active Medications',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20'
    },
    {
      icon: Award,
      value: `${adherenceRate}%`,
      label: 'Adherence Rate',
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/20'
    },
    {
      icon: Clock,
      value: currentStreak,
      label: 'Day Streak',
      color: 'text-info',
      bgColor: 'bg-info/10',
      borderColor: 'border-info/20'
    },
    {
      icon: Calendar,
      value: totalMedications,
      label: 'Total Medications',
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/10',
      borderColor: 'border-muted/20'
    }
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {statsData.map((stat, index) => (
          <MobileCard
            key={index}
            variant="glass"
            className={`${stat.borderColor} ${stat.bgColor} p-3 min-h-0`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center shadow-soft`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className="text-xl font-bold text-foreground">{stat.value}</div>
            </div>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </MobileCard>
        ))}
      </div>

      {/* Progress Bar for Adherence */}
      <div className="px-1">
        <Progress value={adherenceRate} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{currentStreak} day streak</span>
          <span>{adherenceRate}% adherence</span>
        </div>
      </div>

      {/* Alerts Row */}
      {expiringSoon > 0 && (
        <MobileCard variant="glass" className="bg-warning/5 border-warning/20 p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-warning" />
            </div>
            <div className="text-xl font-bold text-warning">{expiringSoon}</div>
          </div>
          <p className="text-xs text-muted-foreground">Expiring Soon</p>
        </MobileCard>
      )}
    </div>
  );
};

export default EnhancedMedicationStatsCard;