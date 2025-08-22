import React, { useState } from 'react';
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
import { useTranslation } from '@/hooks/useTranslation';

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

  // Mock timeline data
  const timelineEvents = {
    today: [
      {
        id: 1,
        time: '08:00',
        type: 'medication',
        title: 'Morning Medication - Sarah',
        description: 'Metformin 500mg + Vitamin D',
        status: 'completed',
        member: { name: 'Sarah Johnson', avatar: 'SJ' },
        icon: Pill,
        color: 'success'
      },
      {
        id: 2,
        time: '09:30',
        type: 'checkup',
        title: 'Blood Pressure Check - John',
        description: '120/80 mmHg - Normal',
        status: 'completed',
        member: { name: 'John Doe', avatar: 'JD' },
        icon: Thermometer,
        color: 'primary'
      },
      {
        id: 3,
        time: '12:00',
        type: 'medication',
        title: 'Lunch Medication - Sarah',
        description: 'Insulin injection due',
        status: 'upcoming',
        member: { name: 'Sarah Johnson', avatar: 'SJ' },
        icon: Pill,
        color: 'warning'
      },
      {
        id: 4,
        time: '14:30',
        type: 'appointment',
        title: 'Doctor Appointment - John',
        description: 'Cardiology follow-up at City Hospital',
        status: 'upcoming',
        member: { name: 'John Doe', avatar: 'JD' },
        icon: Calendar,
        color: 'blue'
      },
      {
        id: 5,
        time: '18:00',
        type: 'medication',
        title: 'Evening Medication - Sarah',
        description: 'Blood pressure medication',
        status: 'pending',
        member: { name: 'Sarah Johnson', avatar: 'SJ' },
        icon: Pill,
        color: 'muted'
      }
    ],
    week: [
      {
        id: 6,
        date: 'Tomorrow',
        events: [
          {
            time: '08:00',
            title: 'Physical Therapy - John',
            type: 'appointment',
            status: 'scheduled'
          },
          {
            time: '10:00',
            title: 'Medication Review - Sarah',
            type: 'checkup',
            status: 'scheduled'
          }
        ]
      },
      {
        id: 7,
        date: 'Wednesday',
        events: [
          {
            time: '15:00',
            title: 'Blood Test - Sarah',
            type: 'appointment',
            status: 'scheduled'
          }
        ]
      }
    ],
    month: [
      {
        id: 8,
        date: 'Next Week',
        events: [
          {
            title: 'Monthly Medication Refill',
            type: 'medication',
            status: 'scheduled'
          },
          {
            title: 'Family Care Review',
            type: 'checkup',
            status: 'scheduled'
          }
        ]
      }
    ]
  };

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

  return (
    <div className="space-y-4 w-full max-w-full">
      {/* Quick Stats and Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-primary/20 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm font-semibold text-primary">Today's Events</p>
            <p className="text-xs text-muted-foreground">{timelineEvents.today.length} scheduled</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-success/5 to-success/10">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-success" />
            </div>
            <p className="text-sm font-semibold text-success">Completed</p>
            <p className="text-xs text-muted-foreground">2 of 5 today</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-warning/5 to-warning/10">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-warning/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-warning" />
            </div>
            <p className="text-sm font-semibold text-warning">Upcoming</p>
            <p className="text-xs text-muted-foreground">2 in next 2hrs</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-destructive/5 to-destructive/10 cursor-pointer" onClick={onEmergencyCall}>
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-destructive/20 flex items-center justify-center animate-pulse">
              <Phone className="w-4 h-4 text-destructive" />
            </div>
            <p className="text-sm font-semibold text-destructive">Emergency</p>
            <p className="text-xs text-muted-foreground">Quick call</p>
          </CardContent>
        </Card>
      </div>

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
            {timelineEvents.today.map((event, index) => {
              const StatusIcon = getStatusIcon(event.status);
              const EventIcon = event.icon;
              
              return (
                <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border hover:bg-muted/50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    event.status === 'completed' ? 'bg-success/20' :
                    event.status === 'upcoming' ? 'bg-warning/20' :
                    event.status === 'pending' ? 'bg-destructive/20' :
                    'bg-muted'
                  }`}>
                    <EventIcon className={`w-4 h-4 ${
                      event.status === 'completed' ? 'text-success' :
                      event.status === 'upcoming' ? 'text-warning' :
                      event.status === 'pending' ? 'text-destructive' :
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
                        event.status === 'pending' ? 'bg-destructive/10 text-destructive' :
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
            })}
          </TabsContent>

          <TabsContent value="week" className="space-y-4">
            {timelineEvents.week.map((day) => (
              <div key={day.id}>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  {day.date}
                </h3>
                <div className="space-y-3 ml-6">
                  {day.events.map((event, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{event.time}</span>
                          <Badge className="text-xs bg-primary/10 text-primary">
                            {event.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{event.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="month" className="space-y-4">
            {timelineEvents.month.map((period) => (
              <div key={period.id}>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  {period.date}
                </h3>
                <div className="space-y-3 ml-6">
                  {period.events.map((event, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{event.title}</p>
                        <Badge className="text-xs bg-primary/10 text-primary mt-1">
                          {event.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default InteractiveFamilyCareTimeline;