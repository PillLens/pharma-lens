import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Pill, TrendingUp, AlertTriangle, CheckCircle, XCircle, Target, Zap, Heart } from 'lucide-react';
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle, MobileCardDescription } from '@/components/ui/mobile/MobileCard';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserMedication } from '@/hooks/useMedicationHistory';
import { format, formatDistanceToNow } from 'date-fns';

interface AdvancedMedicationCardProps {
  medication: UserMedication;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onMarkTaken?: () => void;
  className?: string;
}

const AdvancedMedicationCard: React.FC<AdvancedMedicationCardProps> = ({
  medication,
  onEdit,
  onDelete,
  onToggleActive,
  onMarkTaken,
  className
}) => {
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mock data for enhanced features
  const adherenceRate = Math.floor(Math.random() * 30) + 70; // 70-99%
  const streak = Math.floor(Math.random() * 20) + 1; // 1-20 days
  const effectivenessScore = Math.floor(Math.random() * 20) + 80; // 80-99
  const inventoryDays = Math.floor(Math.random() * 25) + 5; // 5-30 days
  const sideEffectRating = Math.floor(Math.random() * 3) + 1; // 1-3 (1=minimal, 3=significant)
  
  // Mock next dose calculation
  const nextDoseIn = Math.floor(Math.random() * 8) + 1; // 1-8 hours
  const isOverdue = Math.random() > 0.8; // 20% chance of being overdue
  const isDueNow = Math.random() > 0.9; // 10% chance of being due now

  // Update countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      if (isOverdue) {
        setTimeUntilNext('Overdue');
      } else if (isDueNow) {
        setTimeUntilNext('Due Now');
      } else {
        setTimeUntilNext(`${nextDoseIn}h ${Math.floor(Math.random() * 60)}m`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextDoseIn, isOverdue, isDueNow]);

  const getFrequencyLabel = (frequency: string) => {
    const frequencyMap: Record<string, string> = {
      'once_daily': 'Once Daily',
      'twice_daily': 'Twice Daily',
      'three_times_daily': '3x Daily',
      'four_times_daily': '4x Daily',
      'as_needed': 'As Needed',
      'weekly': 'Weekly',
      'monthly': 'Monthly'
    };
    return frequencyMap[frequency] || frequency;
  };

  const getAdherenceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-amber-600';
    return 'text-red-600';
  };

  const getInventoryStatus = (days: number) => {
    if (days <= 7) return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Low Stock' };
    if (days <= 14) return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Running Low' };
    return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Good Stock' };
  };

  const getSideEffectIcon = (rating: number) => {
    if (rating === 1) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (rating === 2) return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const inventoryStatus = getInventoryStatus(inventoryDays);

  return (
    <MobileCard 
      variant={isOverdue ? 'emergency' : isDueNow ? 'warning' : 'medical'} 
      className={`relative overflow-hidden ${className}`}
    >
      {/* Status Indicator Bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        isOverdue ? 'bg-red-500' : 
        isDueNow ? 'bg-amber-500' : 
        medication.is_active ? 'bg-green-500' : 'bg-gray-300'
      }`} />

      <MobileCardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <MobileCardTitle className="text-lg font-bold">
                {medication.medication_name}
              </MobileCardTitle>
              {medication.is_active ? (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  <Pill className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                  Paused
                </Badge>
              )}
            </div>
            <MobileCardDescription className="text-sm">
              {medication.dosage} • {getFrequencyLabel(medication.frequency)}
            </MobileCardDescription>
          </div>

          {/* Next Dose Countdown */}
          <div className="text-right">
            <div className={`text-xs font-medium ${
              isOverdue ? 'text-red-600' : 
              isDueNow ? 'text-amber-600' : 
              'text-muted-foreground'
            }`}>
              Next Dose
            </div>
            <div className={`text-sm font-bold ${
              isOverdue ? 'text-red-600' : 
              isDueNow ? 'text-amber-600 animate-pulse' : 
              'text-primary'
            }`}>
              {timeUntilNext}
            </div>
          </div>
        </div>
      </MobileCardHeader>

      <MobileCardContent className="space-y-4">
        {/* Adherence Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Adherence</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${getAdherenceColor(adherenceRate)}`}>
                {adherenceRate}%
              </span>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
          </div>
          <Progress value={adherenceRate} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {/* Streak */}
          <div className="text-center p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
            <Zap className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <div className="text-sm font-bold text-purple-700">{streak}</div>
            <div className="text-xs text-purple-600">Day Streak</div>
          </div>

          {/* Effectiveness */}
          <div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
            <Heart className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <div className="text-sm font-bold text-blue-700">{effectivenessScore}%</div>
            <div className="text-xs text-blue-600">Effective</div>
          </div>

          {/* Inventory */}
          <div className={`text-center p-3 rounded-lg bg-gradient-to-br from-${inventoryStatus.bg} to-${inventoryStatus.bg} border ${inventoryStatus.border}`}>
            <Calendar className={`w-5 h-5 ${inventoryStatus.color} mx-auto mb-1`} />
            <div className={`text-sm font-bold ${inventoryStatus.color}`}>{inventoryDays}</div>
            <div className={`text-xs ${inventoryStatus.color}`}>Days Left</div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="space-y-2 text-xs text-muted-foreground">
          {medication.start_date && (
            <div className="flex items-center justify-between">
              <span>Started:</span>
              <span className="font-medium">{format(new Date(medication.start_date), 'MMM dd, yyyy')}</span>
            </div>
          )}
          {medication.prescriber && (
            <div className="flex items-center justify-between">
              <span>Prescriber:</span>
              <span className="font-medium">{medication.prescriber}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span>Side Effects:</span>
            <div className="flex items-center gap-1">
              {getSideEffectIcon(sideEffectRating)}
              <span className="font-medium">
                {sideEffectRating === 1 ? 'Minimal' : sideEffectRating === 2 ? 'Moderate' : 'Significant'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {medication.is_active && (
          <div className="flex gap-2 pt-2">
            {(isDueNow || isOverdue) && onMarkTaken && (
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkTaken();
                }}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Mark Taken
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              Edit
            </Button>
          </div>
        )}

        {/* Expiration Warning */}
        {medication.end_date && (
          (() => {
            const endDate = new Date(medication.end_date);
            const today = new Date();
            const diffTime = endDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 7 && diffDays > 0) {
              return (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-xs text-amber-700">
                    Expires in {diffDays} day{diffDays !== 1 ? 's' : ''}
                  </span>
                </div>
              );
            }
            
            if (diffDays <= 0) {
              return (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-xs text-red-700">
                    {diffDays === 0 ? 'Expires today' : 'Expired'}
                  </span>
                </div>
              );
            }
            
            return null;
          })()
        )}
      </MobileCardContent>
    </MobileCard>
  );
};

export default AdvancedMedicationCard;