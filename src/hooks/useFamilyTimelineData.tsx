import { useQuery, useQueryClient } from '@tanstack/react-query';
import { familyCareTimelineService, TimelineEvent, DayTimelineData, TimelineStats } from '@/services/familyCareTimelineService';
import { toast } from 'sonner';

interface TimelineData {
  todayEvents: TimelineEvent[];
  weekEvents: DayTimelineData[];
  monthEvents: DayTimelineData[];
  timelineStats: TimelineStats;
}

export const useFamilyTimelineData = (familyGroups: any[]) => {
  const queryClient = useQueryClient();

  const fetchTimelineData = async (): Promise<TimelineData> => {
    if (!familyGroups || familyGroups.length === 0) {
      return {
        todayEvents: [],
        weekEvents: [],
        monthEvents: [],
        timelineStats: { todayEvents: 0, completed: 0, upcoming: 0, overdue: 0 }
      };
    }

    // Fetch today's events first - most important for immediate display
    const todayEvents = await familyCareTimelineService.getTodayTimeline(familyGroups);
    
    // Calculate stats from the already-fetched today events (no duplicate API call)
    const timelineStats = await familyCareTimelineService.getTimelineStats(todayEvents);

    // Fetch week and month data in parallel (less critical for initial load)
    const [weekEvents, monthEvents] = await Promise.all([
      familyCareTimelineService.getWeekTimeline(familyGroups),
      familyCareTimelineService.getMonthTimeline(familyGroups)
    ]);

    return {
      todayEvents,
      weekEvents,
      monthEvents,
      timelineStats
    };
  };

  const { data, isLoading, error, refetch } = useQuery<TimelineData>({
    queryKey: ['family-timeline', familyGroups?.map(g => g.id).sort().join(',')],
    queryFn: fetchTimelineData,
    enabled: familyGroups && familyGroups.length > 0,
    staleTime: 60000, // 1 minute - timeline data changes less frequently
    gcTime: 300000, // 5 minutes
    retry: 2,
    // Prefetch today's data immediately on mount
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });

  // Handle errors
  if (error) {
    console.error('Error fetching timeline data:', error);
    toast.error('Failed to load timeline data');
  }

  // Prefetch individual tab data when user hovers over tabs
  const prefetchTabData = (tab: 'today' | 'week' | 'month') => {
    if (!data) return;
    
    const cacheKey = ['family-timeline-tab', tab, familyGroups?.map(g => g.id).sort().join(',')];
    
    queryClient.setQueryData(cacheKey, () => {
      switch (tab) {
        case 'today':
          return data.todayEvents;
        case 'week':
          return data.weekEvents;
        case 'month':
          return data.monthEvents;
        default:
          return [];
      }
    });
  };

  return {
    timelineData: data || {
      todayEvents: [],
      weekEvents: [],
      monthEvents: [],
      timelineStats: { todayEvents: 0, completed: 0, upcoming: 0, overdue: 0 }
    },
    loading: isLoading,
    error,
    refetch,
    prefetchTabData
  };
};