import React, { useState } from 'react';
import { Clock, CheckCircle, XCircle, AlertTriangle, Calendar, Pill, Plus, RotateCcw } from 'lucide-react';
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle } from '@/components/ui/mobile/MobileCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, startOfDay, addHours, isWithinInterval, isBefore, isAfter } from 'date-fns';

interface TimelineEvent {
  id: string;
  medicationName: string;
  dosage: string;
  scheduledTime: Date;
  status: 'taken' | 'missed' | 'upcoming' | 'overdue';
  takenTime?: Date;
  category: 'morning' | 'afternoon' | 'evening' | 'night';
}

interface InteractiveMedicationTimelineProps {
  medications: any[];
  onMarkTaken: (eventId: string) => void;
  onMarkMissed: (eventId: string) => void;
  onSnooze: (eventId: string, minutes: number) => void;
  className?: string;
}

const InteractiveMedicationTimeline: React.FC<InteractiveMedicationTimelineProps> = ({
  medications,
  onMarkTaken,
  onMarkMissed,
  onSnooze,
  className
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'today' | 'week'>('today');

  // Mock timeline events for today
  const mockEvents: TimelineEvent[] = [
    {
      id: '1',
      medicationName: 'Lisinopril',
      dosage: '10mg',
      scheduledTime: addHours(startOfDay(new Date()), 8),
      status: 'taken',
      takenTime: addHours(startOfDay(new Date()), 8.2),
      category: 'morning'
    },
    {
      id: '2',
      medicationName: 'Metformin',
      dosage: '500mg',
      scheduledTime: addHours(startOfDay(new Date()), 8),
      status: 'taken',
      takenTime: addHours(startOfDay(new Date()), 8.3),
      category: 'morning'
    },
    {
      id: '3',
      medicationName: 'Vitamin D',
      dosage: '1000 IU',
      scheduledTime: addHours(startOfDay(new Date()), 12),
      status: 'overdue',
      category: 'afternoon'
    },
    {
      id: '4',
      medicationName: 'Atorvastatin',
      dosage: '20mg',
      scheduledTime: addHours(startOfDay(new Date()), 18),
      status: 'upcoming',
      category: 'evening'
    },
    {
      id: '5',
      medicationName: 'Omeprazole',
      dosage: '20mg',
      scheduledTime: addHours(startOfDay(new Date()), 21),
      status: 'upcoming',
      category: 'night'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'taken':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'missed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'overdue':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'upcoming':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taken':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'missed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'upcoming':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <Pill className="w-5 h-5 text-gray-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'morning':
        return '🌅';
      case 'afternoon':
        return '☀️';
      case 'evening':
        return '🌆';
      case 'night':
        return '🌙';
      default:
        return '💊';
    }
  };

  const groupEventsByCategory = (events: TimelineEvent[]) => {
    return events.reduce((groups, event) => {
      const category = event.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(event);
      return groups;
    }, {} as Record<string, TimelineEvent[]>);
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'morning':
        return 'Morning (6AM - 12PM)';
      case 'afternoon':
        return 'Afternoon (12PM - 6PM)';
      case 'evening':
        return 'Evening (6PM - 9PM)';
      case 'night':
        return 'Night (9PM - 12AM)';
      default:
        return category;
    }
  };

  const groupedEvents = groupEventsByCategory(mockEvents);
  const categories = ['morning', 'afternoon', 'evening', 'night'];

  const todayStats = {
    total: mockEvents.length,
    taken: mockEvents.filter(e => e.status === 'taken').length,
    missed: mockEvents.filter(e => e.status === 'missed').length,
    upcoming: mockEvents.filter(e => e.status === 'upcoming').length,
    overdue: mockEvents.filter(e => e.status === 'overdue').length
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Date Selector */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Today's Schedule</h3>
          <p className="text-sm text-muted-foreground">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('today')}
          >
            Today
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            Week
          </Button>
        </div>
      </div>

      {/* Today's Progress Summary */}
      <MobileCard variant="glass">
        <MobileCardContent className="p-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-green-600">{todayStats.taken}</div>
              <div className="text-xs text-muted-foreground">Taken</div>
            </div>
            <div>
              <div className="text-lg font-bold text-amber-600">{todayStats.overdue}</div>
              <div className="text-xs text-muted-foreground">Overdue</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">{todayStats.upcoming}</div>
              <div className="text-xs text-muted-foreground">Upcoming</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600">{todayStats.missed}</div>
              <div className="text-xs text-muted-foreground">Missed</div>
            </div>
          </div>
        </MobileCardContent>
      </MobileCard>

      {/* Timeline by Category */}
      <div className="space-y-6">
        {categories.map((category) => {
          const categoryEvents = groupedEvents[category] || [];
          if (categoryEvents.length === 0) return null;

          return (
            <div key={category} className="space-y-3">
              {/* Category Header */}
              <div className="flex items-center gap-3 px-2">
                <span className="text-2xl">{getCategoryIcon(category)}</span>
                <div>
                  <h4 className="font-semibold text-foreground">{getCategoryTitle(category)}</h4>
                  <p className="text-xs text-muted-foreground">
                    {categoryEvents.length} medication{categoryEvents.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Category Events */}
              <div className="space-y-2">
                {categoryEvents.map((event, index) => (
                  <MobileCard 
                    key={event.id} 
                    className={`border ${getStatusColor(event.status)} transition-all duration-200 hover:shadow-md`}
                  >
                    <MobileCardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {/* Status Icon */}
                        <div className="flex-shrink-0">
                          {getStatusIcon(event.status)}
                        </div>

                        {/* Medication Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-semibold text-foreground truncate">
                              {event.medicationName}
                            </h5>
                            <Badge variant="outline" className="text-xs">
                              {event.dosage}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{format(event.scheduledTime, 'h:mm a')}</span>
                            </div>
                            
                            {event.takenTime && (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="w-3 h-3" />
                                <span>Taken at {format(event.takenTime, 'h:mm a')}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex-shrink-0">
                          {event.status === 'upcoming' && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onMarkTaken(event.id)}
                                className="text-xs px-2 py-1"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Take
                              </Button>
                            </div>
                          )}
                          
                          {event.status === 'overdue' && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={() => onMarkTaken(event.id)}
                                className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Take Now
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onSnooze(event.id, 30)}
                                className="text-xs px-2 py-1"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                          
                          {event.status === 'taken' && (
                            <Badge variant="outline" className={getStatusColor(event.status)}>
                              Complete
                            </Badge>
                          )}
                        </div>
                      </div>
                    </MobileCardContent>
                  </MobileCard>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Add Button */}
      <MobileCard variant="outline" className="cursor-pointer hover:bg-muted/50 transition-colors">
        <MobileCardContent className="p-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add Emergency Dose</span>
          </div>
        </MobileCardContent>
      </MobileCard>
    </div>
  );
};

export default InteractiveMedicationTimeline;