import React, { useState, useEffect } from 'react';
import { 
  Clock, Calendar, Activity, Heart, Phone, MessageCircle, 
  AlertTriangle, CheckCircle, Users, Pill, Thermometer,
  Camera, MapPin, Plus, Bell
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/useTranslation';
import { familyCareTimelineService, TimelineEvent, DayTimelineData, TimelineStats } from '@/services/familyCareTimelineService';
import { QuickStatsGrid } from '@/components/ui/QuickStatsGrid';

interface InteractiveFamilyCareTimelineProps {
  familyGroups: any[];
  onAddEvent?: () => void;
  onScheduleReminder?: () => void;
  onEmergencyCall?: () => void;
}

const InteractiveFamilyCareTimeline: React.FC<InteractiveFamilyCareTimelineProps> = ({
  familyGroups,
  onAddEvent,
  onScheduleReminder,
  onEmergencyCall
}) => {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState('today');
  const [timelineStats, setTimelineStats] = useState<TimelineStats | null>(null);
  const [todayEvents, setTodayEvents] = useState<TimelineEvent[]>([]);
  const [weekEvents, setWeekEvents] = useState<DayTimelineData[]>([]);
  const [monthEvents, setMonthEvents] = useState<DayTimelineData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTimelineData = async () => {
      try {
        setLoading(true);
        
        // Load timeline stats
        const stats = await familyCareTimelineService.getTimelineStats(familyGroups);
        setTimelineStats(stats);

        // Load today's timeline
        const today = await familyCareTimelineService.getTodayTimeline(familyGroups);
        setTodayEvents(today);

        // Load week timeline
        const week = await familyCareTimelineService.getWeekTimeline(familyGroups);
        setWeekEvents(week);

        // Load month timeline
        const month = await familyCareTimelineService.getMonthTimeline(familyGroups);
        setMonthEvents(month);
      } catch (error) {
        console.error('Error loading timeline data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (familyGroups.length > 0) {
      loadTimelineData();
    } else {
      setLoading(false);
    }
  }, [familyGroups]);

  // Helper functions for status handling

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'upcoming': return 'warning';
      case 'pending': return 'destructive';
      default: return 'muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'upcoming': return Clock;
      case 'pending': return AlertTriangle;
      default: return Activity;
    }
  };

  // Prepare timeline stats data for QuickStatsGrid
  const timelineStatsData = [
    {
      icon: Calendar,
      value: timelineStats?.todayEvents || 0,
      label: "Today's Events",
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20'
    },
    {
      icon: CheckCircle,
      value: timelineStats?.completed || 0,
      label: 'Completed',
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/20'
    },
    {
      icon: Clock,
      value: timelineStats?.upcoming || 0,
      label: 'Upcoming',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/20'
    },
    {
      icon: Phone,
      value: 'SOS',
      label: 'Emergency',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      borderColor: 'border-destructive/20',
      onClick: onEmergencyCall
    }
  ];

  return (
    <div className="space-y-4 w-full max-w-full">
      {/* Quick Stats and Actions */}
      <QuickStatsGrid stats={timelineStatsData} className="mb-4" />

      {/* Care Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Care Timeline
          </h2>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={onScheduleReminder}>
              <Bell className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={onAddEvent}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="w-6 h-6 rounded-full" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : todayEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No events scheduled for today</p>
              </div>
            ) : (
              todayEvents.map((event) => {
                const StatusIcon = getStatusIcon(event.status);
                const iconMap: any = { Pill, Calendar, CheckSquare: Activity };
                const EventIcon = iconMap[event.icon] || Activity;
                
                return (
                  <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border hover:bg-muted/50 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      event.status === 'completed' ? 'bg-success/20' :
                      event.status === 'upcoming' ? 'bg-warning/20' :
                      event.status === 'pending' || event.status === 'overdue' ? 'bg-destructive/20' :
                      'bg-muted'
                    }`}>
                      <EventIcon className={`w-4 h-4 ${
                        event.status === 'completed' ? 'text-success' :
                        event.status === 'upcoming' ? 'text-warning' :
                        event.status === 'pending' || event.status === 'overdue' ? 'text-destructive' :
                        'text-muted-foreground'
                      }`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-muted-foreground">
                          {event.time}
                        </span>
                        <Badge className={`text-xs ${
                          event.status === 'completed' ? 'bg-success/10 text-success' :
                          event.status === 'upcoming' ? 'bg-warning/10 text-warning' :
                          event.status === 'pending' || event.status === 'overdue' ? 'bg-destructive/10 text-destructive' :
                          'bg-muted/50 text-muted-foreground'
                        }`}>
                          {event.status}
                        </Badge>
                        <StatusIcon className={`w-4 h-4 ml-auto ${
                          event.status === 'completed' ? 'text-success' :
                          event.status === 'upcoming' ? 'text-warning' :
                          'text-destructive'
                        }`} />
                      </div>
                      
                      <h4 className="font-medium text-foreground mb-1">{event.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                      
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {event.member.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          {event.member.name}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="week" className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i}>
                    <Skeleton className="h-6 w-32 mb-3" />
                    <div className="space-y-3 ml-6">
                      {[1, 2].map(j => (
                        <div key={j} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                          <Skeleton className="w-2 h-2 rounded-full" />
                          <div className="flex-1 space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : weekEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No events scheduled this week</p>
              </div>
            ) : (
              weekEvents.map((day) => (
                <div key={day.id}>
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    {day.date}
                  </h3>
                  <div className="space-y-3 ml-6">
                    {day.events.map((event) => (
                      <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{event.time}</span>
                            <Badge className={`text-xs ${
                              event.status === 'completed' ? 'bg-success/10 text-success' :
                              'bg-primary/10 text-primary'
                            }`}>
                              {event.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{event.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="month" className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i}>
                    <Skeleton className="h-6 w-32 mb-3" />
                    <div className="space-y-3 ml-6">
                      {[1, 2].map(j => (
                        <div key={j} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                          <Skeleton className="w-2 h-2 rounded-full" />
                          <div className="flex-1 space-y-1">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-5 w-20" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : monthEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No events scheduled this month</p>
              </div>
            ) : (
              monthEvents.map((period) => (
                <div key={period.id}>
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    {period.date}
                  </h3>
                  <div className="space-y-3 ml-6">
                    {period.events.map((event) => (
                      <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{event.title}</p>
                          <Badge className={`text-xs mt-1 ${
                            event.status === 'completed' ? 'bg-success/10 text-success' :
                            'bg-primary/10 text-primary'
                          }`}>
                            {event.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default InteractiveFamilyCareTimeline;