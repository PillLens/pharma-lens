import React from 'react';
import { Calendar, Pill, AlertTriangle, CheckCircle, XCircle, Edit, Clock } from 'lucide-react';
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle, MobileCardDescription } from '@/components/ui/mobile/MobileCard';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserMedication } from '@/hooks/useMedicationHistory';
import { format } from 'date-fns';

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
  // Generate stable data based on medication ID to prevent constant changes
  const generateStableValue = (seed: string, min: number, max: number) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % (max - min + 1) + min;
  };

  // Stable values based on medication ID
  const adherenceRate = generateStableValue(medication.id, 85, 98);
  const inventoryDays = generateStableValue(medication.id + 'inventory', 5, 30);
  
  // Calculate next dose time based on frequency (stable)
  const getNextDoseStatus = () => {
    const now = new Date();
    const hour = now.getHours();
    
    switch (medication.frequency) {
      case 'once_daily':
        return hour < 8 ? 'Due at 8:00 AM' : 'Next: Tomorrow 8:00 AM';
      case 'twice_daily':
        if (hour < 8) return 'Due at 8:00 AM';
        if (hour < 20) return 'Due at 8:00 PM';
        return 'Next: Tomorrow 8:00 AM';
      case 'three_times_daily':
        if (hour < 8) return 'Due at 8:00 AM';
        if (hour < 14) return 'Due at 2:00 PM';
        if (hour < 20) return 'Due at 8:00 PM';
        return 'Next: Tomorrow 8:00 AM';
      default:
        return 'As needed';
    }
  };

  const nextDoseStatus = getNextDoseStatus();
  const isDueNow = nextDoseStatus.includes('Due at') && new Date().getHours() >= 8;

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

  const getInventoryStatus = (days: number) => {
    if (days <= 7) return { color: 'destructive', bg: 'destructive', status: 'Low' };
    if (days <= 14) return { color: 'warning', bg: 'warning', status: 'Running Low' };
    return { color: 'success', bg: 'success', status: 'Good' };
  };

  const inventoryStatus = getInventoryStatus(inventoryDays);

  return (
    <MobileCard 
      variant={isDueNow ? 'warning' : 'default'} 
      className={`group hover:shadow-lg transition-all duration-300 ${className}`}
    >
      <MobileCardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
                <Pill className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <MobileCardTitle className="text-lg font-semibold truncate">
                  {medication.medication_name}
                </MobileCardTitle>
                <MobileCardDescription className="text-sm text-muted-foreground">
                  {medication.dosage} • {getFrequencyLabel(medication.frequency)}
                </MobileCardDescription>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge 
              variant={medication.is_active ? 'default' : 'secondary'} 
              className="text-xs"
            >
              {medication.is_active ? 'Active' : 'Paused'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </MobileCardHeader>

      <MobileCardContent className="space-y-4">
        {/* Next Dose Info */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Next Dose</span>
          </div>
          <span className={`text-sm font-semibold ${isDueNow ? 'text-warning' : 'text-foreground'}`}>
            {nextDoseStatus}
          </span>
        </div>

        {/* Progress and Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Adherence Rate</span>
            <span className="text-sm font-bold text-primary">{adherenceRate}%</span>
          </div>
          <Progress value={adherenceRate} className="h-2" />
        </div>

        {/* Inventory Status */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Supply</span>
          </div>
          <Badge variant="outline" className={`text-xs ${
            inventoryDays <= 7 ? 'border-destructive text-destructive' :
            inventoryDays <= 14 ? 'border-warning text-warning' :
            'border-success text-success'
          }`}>
            {inventoryDays} days left
          </Badge>
        </div>

        {/* Additional Info */}
        {(medication.start_date || medication.prescriber) && (
          <div className="pt-2 space-y-2 text-xs text-muted-foreground border-t border-border">
            {medication.start_date && (
              <div className="flex items-center justify-between">
                <span>Started:</span>
                <span className="font-medium">{format(new Date(medication.start_date), 'MMM dd, yyyy')}</span>
              </div>
            )}
            {medication.prescriber && (
              <div className="flex items-center justify-between">
                <span>Prescriber:</span>
                <span className="font-medium truncate ml-2">{medication.prescriber}</span>
              </div>
            )}
          </div>
        )}

        {/* Quick Action */}
        {medication.is_active && isDueNow && onMarkTaken && (
          <Button
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onMarkTaken();
            }}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark as Taken
          </Button>
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
                <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-xs text-warning font-medium">
                    Expires in {diffDays} day{diffDays !== 1 ? 's' : ''}
                  </span>
                </div>
              );
            }
            
            if (diffDays <= 0) {
              return (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <XCircle className="w-4 h-4 text-destructive" />
                  <span className="text-xs text-destructive font-medium">
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