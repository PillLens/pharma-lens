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
    <div className={`space-y-6 ${className}`}>
      {/* Main Stats Row - Simplified */}
      <div className="grid grid-cols-2 gap-4">
        {/* Overview Stats */}
        <MobileCard variant="default" className="bg-gradient-to-br from-primary/5 to-primary/10">
          <MobileCardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{activeMedications}</div>
                <div className="text-xs text-muted-foreground">of {totalMedications} active</div>
              </div>
            </div>
            <div className="text-sm font-medium text-foreground">Active Medications</div>
          </MobileCardContent>
        </MobileCard>

        {/* Adherence Overview */}
        <MobileCard variant="default" className="bg-gradient-to-br from-success/5 to-success/10">
          <MobileCardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-success" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-success">{adherenceRate}%</div>
                <div className="text-xs text-muted-foreground">{currentStreak} day streak</div>
              </div>
            </div>
            <div className="text-sm font-medium text-foreground">Adherence Rate</div>
            <Progress value={adherenceRate} className="h-2 mt-2" />
          </MobileCardContent>
        </MobileCard>
      </div>

      {/* Alerts Row */}
      {expiringSoon > 0 && (
        <MobileCard variant="default" className="bg-gradient-to-r from-warning/5 to-warning/10 border-warning/20">
          <MobileCardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">Medications Expiring Soon</div>
                <div className="text-xs text-muted-foreground">
                  {expiringSoon} medication{expiringSoon !== 1 ? 's' : ''} expire within 7 days
                </div>
              </div>
              <div className="text-lg font-bold text-warning">{expiringSoon}</div>
            </div>
          </MobileCardContent>
        </MobileCard>
      )}
    </div>
  );
};

export default EnhancedMedicationStatsCard;