import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useUserTimezone } from '@/hooks/useUserTimezone';
import { missedDoseTrackingService } from '@/services/missedDoseTrackingService';

export const useMissedDoseData = () => {
  const { user } = useAuth();
  const { timezone } = useUserTimezone();

  const { 
    data: missedDoses = [], 
    isLoading: missedLoading,
    refetch: refetchMissed 
  } = useQuery({
    queryKey: ['missed-doses', user?.id, timezone],
    queryFn: () => missedDoseTrackingService.getTodaysMissedDoses(user!.id, timezone),
    enabled: !!user,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });

  const { 
    data: overdueDoses = [], 
    isLoading: overdueLoading,
    refetch: refetchOverdue 
  } = useQuery({
    queryKey: ['overdue-doses', user?.id, timezone],
    queryFn: () => missedDoseTrackingService.getOverdueDoses(user!.id, timezone),
    enabled: !!user,
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Refetch every 30 seconds for overdue
  });

  return {
    missedDoses,
    overdueDoses,
    loading: missedLoading || overdueLoading,
    refetchMissed,
    refetchOverdue,
    totalMissed: missedDoses.length,
    totalOverdue: overdueDoses.length
  };
};