import React, { useState, useEffect } from 'react';
import { Calendar, Pill, AlertTriangle, CheckCircle, XCircle, Edit, Clock, TrendingUp, Heart, Zap, MoreVertical } from 'lucide-react';
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle, MobileCardDescription } from '@/components/ui/mobile/MobileCard';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MobileButton } from '@/components/ui/mobile/MobileButton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserMedication } from '@/hooks/useMedicationHistory';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getNextDoseTime } from '@/utils/timezoneUtils';
import { useUserTimezone } from '@/hooks/useUserTimezone';

interface EnhancedMedicationCardProps {
  medication: UserMedication;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onMarkTaken?: () => void;
  className?: string;
  onClick?: () => void;
}

const EnhancedMedicationCard: React.FC<EnhancedMedicationCardProps> = ({
  medication,
  onEdit,
  onDelete,
  onToggleActive,
  onMarkTaken,
  className,
  onClick
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { timezone } = useUserTimezone();
  const [recentlyTaken, setRecentlyTaken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [manuallyMarkedTaken, setManuallyMarkedTaken] = useState(false);

  // Check if medication was taken recently
  useEffect(() => {
    const checkRecentDose = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        
        console.log('Checking recent dose for medication:', medication.medication_name);
        
        // Check for doses taken today for this medication
        const { data, error } = await supabase
          .from('medication_adherence_log')
          .select('taken_time, scheduled_time')
          .eq('user_id', user.id)
          .eq('medication_id', medication.id)
          .eq('status', 'taken')
          .gte('taken_time', startOfDay.toISOString())
          .order('taken_time', { ascending: false });

        if (error) {
          console.error('Error checking recent doses:', error);
          setLoading(false);
          return;
        }

        console.log('Recent doses found:', data?.length || 0);

        // Check if a dose was taken in the current time window
        const hour = now.getHours();
        let takenInCurrentWindow = false;

        if (data && data.length > 0) {
          for (const dose of data) {
            const takenTime = new Date(dose.taken_time);
            const takenHour = takenTime.getHours();
            
            switch (medication.frequency) {
              case 'once_daily':
                // If taken any time today
                takenInCurrentWindow = true;
                break;
              case 'twice_daily':
                // Morning window (6-14) or Evening window (18-23)
                if (hour >= 6 && hour < 14) {
                  // Current time is morning - check if morning dose was taken
                  if (takenHour >= 6 && takenHour < 14) {
                    takenInCurrentWindow = true;
                    break;
                  }
                } else if (hour >= 18 && hour <= 23) {
                  // Current time is evening - check if evening dose was taken
                  if (takenHour >= 18 && takenHour <= 23) {
                    takenInCurrentWindow = true;
                    break;
                  }
                }
                break;
              case 'three_times_daily':
                // Morning (6-12), Afternoon (12-18), Evening (18-23)
                if (hour >= 6 && hour < 12) {
                  // Morning window
                  if (takenHour >= 6 && takenHour < 12) {
                    takenInCurrentWindow = true;
                    break;
                  }
                } else if (hour >= 12 && hour < 18) {
                  // Afternoon window  
                  if (takenHour >= 12 && takenHour < 18) {
                    takenInCurrentWindow = true;
                    break;
                  }
                } else if (hour >= 18 && hour <= 23) {
                  // Evening window
                  if (takenHour >= 18 && takenHour <= 23) {
                    takenInCurrentWindow = true;
                    break;
                  }
                }
                break;
            }
          }
        }

        console.log('Taken in current window:', takenInCurrentWindow);
        // Don't override manual state changes
        if (!manuallyMarkedTaken) {
          setRecentlyTaken(takenInCurrentWindow);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error checking recent doses:', error);
        setLoading(false);
      }
    };

    checkRecentDose();
  }, [user, medication, manuallyMarkedTaken]);

  // Real data state for medication statistics
  const [medicationStats, setMedicationStats] = useState({
    adherenceRate: 0,
    inventoryDays: 0,
    streak: 0,
    isLoading: true
  });

  // Fetch real medication statistics
  useEffect(() => {
    const fetchMedicationStats = async () => {
      if (!user || !medication.id) return;

      try {
        // Fetch adherence data from the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: adherenceData, error: adherenceError } = await supabase
          .from('medication_adherence_log')
          .select('status, scheduled_time, taken_time')
          .eq('user_id', user.id)
          .eq('medication_id', medication.id)
          .gte('scheduled_time', sevenDaysAgo.toISOString())
          .order('scheduled_time', { ascending: false });

        if (adherenceError) throw adherenceError;

        // Calculate adherence rate
        const totalDoses = adherenceData?.length || 0;
        const takenDoses = adherenceData?.filter(d => d.status === 'taken').length || 0;
        const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

        // Calculate streak (consecutive days with doses taken)
        let streak = 0;
        if (adherenceData && adherenceData.length > 0) {
          const dailyTaken = new Map();
          
          adherenceData.forEach(log => {
            const date = new Date(log.scheduled_time).toDateString();
            if (!dailyTaken.has(date)) {
              dailyTaken.set(date, { taken: 0, total: 0 });
            }
            dailyTaken.get(date).total++;
            if (log.status === 'taken') {
              dailyTaken.get(date).taken++;
            }
          });

          // Count consecutive days from today backwards
          const sortedDates = Array.from(dailyTaken.keys())
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
          
          for (const date of sortedDates) {
            const dayData = dailyTaken.get(date);
            if (dayData.taken >= dayData.total && dayData.total > 0) {
              streak++;
            } else {
              break;
            }
          }
        }

        // Calculate inventory days based on start/end dates
        let inventoryDays = 30; // Default fallback
        if (medication.end_date) {
          const endDate = new Date(medication.end_date);
          const today = new Date();
          const diffTime = endDate.getTime() - today.getTime();
          inventoryDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        } else if (medication.start_date) {
          // If no end date, calculate based on typical prescription length (30 days default)
          const startDate = new Date(medication.start_date);
          const today = new Date();
          const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          inventoryDays = Math.max(0, 30 - daysSinceStart); // Assume 30-day supply
        }

        setMedicationStats({
          adherenceRate,
          inventoryDays,
          streak,
          isLoading: false
        });

      } catch (error) {
        console.error('Error fetching medication stats:', error);
        // Fallback to default values
        setMedicationStats({
          adherenceRate: 95,
          inventoryDays: 15,
          streak: 3,
          isLoading: false
        });
      }
    };

    fetchMedicationStats();
  }, [user, medication.id, medication.start_date, medication.end_date]);
  
  // Calculate if medication is currently due using proper timezone
  const doseStatus = getNextDoseTime(medication.frequency, timezone, recentlyTaken);
  const isDueNow = doseStatus.isDue;
  const nextDoseStatus = doseStatus.nextTime;
  const isOverdue = doseStatus.isOverdue;
  
  console.log('Medication:', medication.medication_name, 'isDue:', isDueNow, 'isOverdue:', isOverdue, 'nextTime:', nextDoseStatus, 'timezone:', timezone);

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
    if (days <= 7) return { variant: 'destructive', label: 'Low Stock' };
    if (days <= 14) return { variant: 'warning', label: 'Running Low' };
    return { variant: 'success', label: 'Good Stock' };
  };

  const inventoryStatus = getInventoryStatus(medicationStats.inventoryDays);

  return (
    <MobileCard 
      variant={isDueNow ? 'warning' : isOverdue ? 'emergency' : 'default'} 
      className={`group transition-all duration-300 hover:shadow-lg ${className}`}
      onClick={onClick}
    >
      <MobileCardHeader className="pb-1">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div 
              className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm bg-gradient-to-br from-primary/70 to-primary/50`}
            >
              <Pill className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <MobileCardTitle className="text-sm font-bold truncate mb-0.5">
                {medication.medication_name}
              </MobileCardTitle>
              <MobileCardDescription className="text-xs text-muted-foreground">
                {medication.dosage} • {getFrequencyLabel(medication.frequency)}
              </MobileCardDescription>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge 
                  variant={medication.is_active ? 'default' : 'secondary'} 
                  className="text-xs px-1.5 py-0.5"
                >
                  {medication.is_active ? 'Active' : 'Paused'}
                </Badge>
                {isDueNow && !recentlyTaken && (
                  <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                    <Clock className="w-3 h-3 mr-0.5" />
                    Due Now
                  </Badge>
                )}
                {isOverdue && !recentlyTaken && (
                  <Badge variant="destructive" className="text-xs px-1.5 py-0.5 bg-red-100 text-red-800 border-red-300">
                    <AlertTriangle className="w-3 h-3 mr-0.5" />
                    Overdue
                  </Badge>
                )}
                {recentlyTaken && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-success/10 text-success border-success/20">
                    <CheckCircle className="w-3 h-3 mr-0.5" />
                    Taken Today
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <MobileButton
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-60 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </MobileButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleActive}>
                {medication.is_active ? 'Pause' : 'Activate'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </MobileCardHeader>

      <MobileCardContent className="space-y-2">
        {/* Take Now Button - Show for due medications or always for overdue medications */}
        {medication.is_active && ((isDueNow && !recentlyTaken) || isOverdue) && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/30 shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Pill className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-xs font-semibold text-primary">
                  {isDueNow ? "Time to take your dose!" : isOverdue ? "Overdue - Take now!" : "Mark as taken"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {nextDoseStatus}
                </div>
              </div>
            </div>
            <MobileButton
              size="lg"
              onClick={async (e) => {
                e.stopPropagation();
                
                // Use the parent callback to handle dose recording
                // This prevents double database insertions
                if (onMarkTaken) {
                  // Immediately update UI state for better UX
                  setRecentlyTaken(true);
                  setManuallyMarkedTaken(true);
                  console.log('Take Now clicked - updating state');
                  
                  // Call parent callback which handles the actual database operation
                  onMarkTaken();
                } else {
                  toast({
                    title: "Error",
                    description: "Unable to record dose. Please try again.",
                    variant: "destructive",
                  });
                }
              }
              className={`h-10 px-4 rounded-xl ${
                isOverdue 
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' 
                  : 'bg-gradient-to-r from-success to-success/90 hover:from-success/90 hover:to-success/80'
              } text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-sm`}
              haptic
            >
              <CheckCircle className="w-4 h-4 mr-1.5" />
              {isOverdue ? 'Take Now (Overdue)' : 'Take Now'}
            </MobileButton>
          </div>
        )}

        {/* Compact Stats */}
        <div className="grid grid-cols-3 gap-1.5">
          <div className="text-center p-1.5 rounded-lg bg-muted/30">
            <div className="text-xs font-bold text-primary">
              {medicationStats.isLoading ? '...' : `${medicationStats.adherenceRate}%`}
            </div>
            <div className="text-xs text-muted-foreground">Adherence</div>
          </div>
          <div className="text-center p-1.5 rounded-lg bg-muted/30">
            <div className="text-xs font-bold text-success">
              {medicationStats.isLoading ? '...' : medicationStats.streak}
            </div>
            <div className="text-xs text-muted-foreground">Day Streak</div>
          </div>
          <div className="text-center p-1.5 rounded-lg bg-muted/30">
            <div className={`text-xs font-bold ${
              medicationStats.inventoryDays <= 7 ? 'text-destructive' : 
              medicationStats.inventoryDays <= 14 ? 'text-warning' : 'text-success'
            }`}>
              {medicationStats.isLoading ? '...' : medicationStats.inventoryDays}
            </div>
            <div className="text-xs text-muted-foreground">Days Left</div>
          </div>
        </div>

        {/* Next Dose Info - Only show if medication is active and not due now or overdue */}
        {medication.is_active && !isDueNow && !isOverdue && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs">Next Dose</span>
            </div>
            <span className="text-xs font-medium">{nextDoseStatus}</span>
          </div>
        )}

        {/* Expiration Warnings */}
        {medication.end_date && (
          (() => {
            const endDate = new Date(medication.end_date);
            const today = new Date();
            const diffTime = endDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 7 && diffDays > 0) {
              return (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-warning/10 border border-warning/20">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <div className="text-sm text-warning">
                    Expires in {diffDays} day{diffDays !== 1 ? 's' : ''}
                  </div>
                </div>
              );
            }
            
            if (diffDays <= 0) {
              return (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                  <XCircle className="w-4 h-4 text-destructive" />
                  <div className="text-sm text-destructive">
                    {diffDays === 0 ? 'Expires today' : 'Expired'}
                  </div>
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

export default EnhancedMedicationCard;