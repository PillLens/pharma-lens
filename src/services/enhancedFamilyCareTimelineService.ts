import { supabase } from '@/integrations/supabase/client';

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  status: 'completed' | 'pending' | 'upcoming' | 'overdue';
  member: {
    name: string;
    avatar: string;
    id: string;
  };
  priority: 'normal' | 'high' | 'emergency';
  type: 'medication' | 'appointment' | 'task' | 'alert' | 'activity';
  created_at: string;
  due_date?: string;
  metadata?: any;
}

export interface DayTimelineData {
  date: string;
  events: TimelineEvent[];
  completionRate: number;
}

export interface TimelineStats {
  todayEvents: number;
  completed: number;
  upcoming: number;
  overdue: number;
}

class EnhancedFamilyCareTimelineService {
  
  async getTodayTimeline(familyGroups: any[]): Promise<TimelineEvent[]> {
    if (!familyGroups?.length) return [];

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    try {
      const [medicationEvents, appointmentEvents, taskEvents, activityEvents] = await Promise.all([
        this.getMedicationEvents(familyGroups, todayStart, todayEnd),
        this.getAppointmentEvents(familyGroups, todayStart, todayEnd),
        this.getTaskEvents(familyGroups, todayStart, todayEnd),
        this.getActivityEvents(familyGroups, todayStart, todayEnd)
      ]);

      const allEvents = [
        ...medicationEvents,
        ...appointmentEvents,
        ...taskEvents,
        ...activityEvents
      ];

      return allEvents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.error('Error fetching today timeline:', error);
      return [];
    }
  }

  async getWeekTimeline(familyGroups: any[]): Promise<DayTimelineData[]> {
    if (!familyGroups?.length) return [];

    const weekData: DayTimelineData[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      try {
        const [medicationEvents, appointmentEvents, taskEvents] = await Promise.all([
          this.getMedicationEvents(familyGroups, dayStart, dayEnd),
          this.getAppointmentEvents(familyGroups, dayStart, dayEnd),
          this.getTaskEvents(familyGroups, dayStart, dayEnd)
        ]);

        const events = [...medicationEvents, ...appointmentEvents, ...taskEvents];
        const completedEvents = events.filter(e => e.status === 'completed');
        const completionRate = events.length > 0 ? Math.round((completedEvents.length / events.length) * 100) : 0;

        weekData.push({
          date: dayStart.toISOString().split('T')[0],
          events: events.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
          completionRate
        });
      } catch (error) {
        console.error(`Error fetching timeline for ${dayStart.toDateString()}:`, error);
        weekData.push({
          date: dayStart.toISOString().split('T')[0],
          events: [],
          completionRate: 0
        });
      }
    }

    return weekData;
  }

  async getMonthTimeline(familyGroups: any[]): Promise<DayTimelineData[]> {
    if (!familyGroups?.length) return [];

    const monthData: DayTimelineData[] = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      try {
        const [medicationEvents, appointmentEvents, taskEvents] = await Promise.all([
          this.getMedicationEvents(familyGroups, dayStart, dayEnd),
          this.getAppointmentEvents(familyGroups, dayStart, dayEnd),
          this.getTaskEvents(familyGroups, dayStart, dayEnd)
        ]);

        const events = [...medicationEvents, ...appointmentEvents, ...taskEvents];
        const completedEvents = events.filter(e => e.status === 'completed');
        const completionRate = events.length > 0 ? Math.round((completedEvents.length / events.length) * 100) : 0;

        if (events.length > 0) { // Only include days with events for month view
          monthData.push({
            date: dayStart.toISOString().split('T')[0],
            events: events.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
            completionRate
          });
        }
      } catch (error) {
        console.error(`Error fetching timeline for ${dayStart.toDateString()}:`, error);
      }
    }

    return monthData;
  }

  async getTimelineStats(todayEvents: TimelineEvent[]): Promise<TimelineStats> {
    const now = new Date();
    
    const completed = todayEvents.filter(e => e.status === 'completed').length;
    const upcoming = todayEvents.filter(e => 
      e.status === 'upcoming' || 
      (e.status === 'pending' && e.due_date && new Date(e.due_date) > now)
    ).length;
    const overdue = todayEvents.filter(e => 
      e.status === 'overdue' || 
      (e.status === 'pending' && e.due_date && new Date(e.due_date) < now)
    ).length;

    return {
      todayEvents: todayEvents.length,
      completed,
      upcoming,
      overdue
    };
  }

  private async getMedicationEvents(
    familyGroups: any[], 
    startDate: Date, 
    endDate: Date
  ): Promise<TimelineEvent[]> {
    const groupIds = familyGroups.map(g => g.id);
    
    // Get family members
    const { data: members } = await supabase
      .from('family_members')
      .select('user_id, family_group_id')
      .in('family_group_id', groupIds)
      .eq('invitation_status', 'accepted');

    const { data: { user } } = await supabase.auth.getUser();
    const allUserIds = [user?.id, ...(members?.map(m => m.user_id) || [])].filter(Boolean);

    // Get adherence events
    const { data: adherenceData } = await supabase
      .from('medication_adherence_log')
      .select(`
        id,
        status,
        scheduled_time,
        taken_time,
        created_at,
        notes,
        user_id,
        medication_id,
        user_medications:medication_id (medication_name),
        profiles:user_id (display_name, email)
      `)
      .in('user_id', allUserIds)
      .gte('scheduled_time', startDate.toISOString())
      .lt('scheduled_time', endDate.toISOString());

    return (adherenceData || []).map(event => {
      const profile = event.profiles as any;
      const medication = event.user_medications as any;
      const userName = profile?.display_name || profile?.email?.split('@')[0] || 'Unknown';
      
      return {
        id: `med-${event.id}`,
        time: new Date(event.scheduled_time).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        title: `${medication?.medication_name || 'Medication'}`,
        description: this.getMedicationDescription(event.status, userName),
        status: this.getMedicationStatus(event.status, event.scheduled_time),
        member: {
          name: userName,
          avatar: this.getInitials(userName),
          id: event.user_id
        },
        priority: event.status === 'missed' ? 'high' : 'normal',
        type: 'medication' as const,
        created_at: event.created_at,
        due_date: event.scheduled_time,
        metadata: { notes: event.notes }
      };
    });
  }

  private async getAppointmentEvents(
    familyGroups: any[], 
    startDate: Date, 
    endDate: Date
  ): Promise<TimelineEvent[]> {
    const groupIds = familyGroups.map(g => g.id);

    const { data: appointments } = await supabase
      .from('family_appointments')
      .select(`
        id,
        title,
        description,
        appointment_date,
        status,
        appointment_type,
        provider_name,
        created_at,
        created_by,
        patient_id,
        profiles:created_by (display_name, email),
        patient_profile:patient_id (display_name, email)
      `)
      .in('family_group_id', groupIds)
      .gte('appointment_date', startDate.toISOString())
      .lt('appointment_date', endDate.toISOString());

    return (appointments || []).map(appointment => {
      const createdBy = appointment.profiles as any;
      const patient = appointment.patient_profile as any;
      const createdByName = createdBy?.display_name || createdBy?.email?.split('@')[0] || 'Unknown';
      const patientName = patient?.display_name || patient?.email?.split('@')[0] || 'Patient';
      
      return {
        id: `apt-${appointment.id}`,
        time: new Date(appointment.appointment_date).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        title: appointment.title,
        description: `${appointment.appointment_type} appointment for ${patientName}${appointment.provider_name ? ` with ${appointment.provider_name}` : ''}`,
        status: this.getAppointmentStatus(appointment.status, appointment.appointment_date),
        member: {
          name: createdByName,
          avatar: this.getInitials(createdByName),
          id: appointment.created_by
        },
        priority: 'normal',
        type: 'appointment' as const,
        created_at: appointment.created_at,
        due_date: appointment.appointment_date,
        metadata: { 
          provider: appointment.provider_name,
          patient: patientName,
          type: appointment.appointment_type
        }
      };
    });
  }

  private async getTaskEvents(
    familyGroups: any[], 
    startDate: Date, 
    endDate: Date
  ): Promise<TimelineEvent[]> {
    const groupIds = familyGroups.map(g => g.id);

    const { data: tasks } = await supabase
      .from('care_tasks')
      .select(`
        id,
        title,
        description,
        status,
        priority,
        task_type,
        due_date,
        completed_at,
        created_at,
        assigned_to,
        assigned_by,
        assignee:assigned_to (display_name, email),
        assigner:assigned_by (display_name, email)
      `)
      .in('family_group_id', groupIds)
      .or(`due_date.gte.${startDate.toISOString()},due_date.lt.${endDate.toISOString()},completed_at.gte.${startDate.toISOString()},completed_at.lt.${endDate.toISOString()}`);

    return (tasks || []).map(task => {
      const assignee = task.assignee as any;
      const assigneeName = assignee?.display_name || assignee?.email?.split('@')[0] || 'Unknown';
      
      return {
        id: `task-${task.id}`,
        time: task.due_date ? new Date(task.due_date).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : '—',
        title: task.title,
        description: task.description || `${task.task_type} task assigned to ${assigneeName}`,
        status: this.getTaskStatus(task.status, task.due_date),
        member: {
          name: assigneeName,
          avatar: this.getInitials(assigneeName),
          id: task.assigned_to
        },
        priority: task.priority as 'normal' | 'high' | 'emergency',
        type: 'task' as const,
        created_at: task.created_at,
        due_date: task.due_date,
        metadata: { 
          task_type: task.task_type,
          completed_at: task.completed_at
        }
      };
    });
  }

  private async getActivityEvents(
    familyGroups: any[], 
    startDate: Date, 
    endDate: Date
  ): Promise<TimelineEvent[]> {
    const groupIds = familyGroups.map(g => g.id);

    const { data: activities } = await supabase
      .from('family_activity_log')
      .select(`
        id,
        activity_type,
        activity_data,
        priority,
        created_at,
        user_id,
        profiles:user_id (display_name, email)
      `)
      .in('family_group_id', groupIds)
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString())
      .limit(5); // Limit activity events to avoid clutter

    return (activities || []).map(activity => {
      const profile = activity.profiles as any;
      const userName = profile?.display_name || profile?.email?.split('@')[0] || 'Unknown';
      
      return {
        id: `activity-${activity.id}`,
        time: new Date(activity.created_at).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        title: this.getActivityTitle(activity.activity_type),
        description: this.getActivityDescription(activity.activity_type, activity.activity_data, userName),
        status: 'completed' as const,
        member: {
          name: userName,
          avatar: this.getInitials(userName),
          id: activity.user_id
        },
        priority: activity.priority as 'normal' | 'high' | 'emergency',
        type: 'activity' as const,
        created_at: activity.created_at
      };
    });
  }

  private getMedicationDescription(status: string, userName: string): string {
    switch (status) {
      case 'taken': return `${userName} took their scheduled dose`;
      case 'missed': return `${userName} missed their scheduled dose`;
      case 'scheduled': return `Scheduled dose for ${userName}`;
      default: return `Medication event for ${userName}`;
    }
  }

  private getMedicationStatus(status: string, scheduledTime: string): TimelineEvent['status'] {
    const now = new Date();
    const scheduled = new Date(scheduledTime);
    
    switch (status) {
      case 'taken': return 'completed';
      case 'missed': return 'overdue';
      case 'scheduled': 
        if (scheduled > now) return 'upcoming';
        return 'overdue';
      default: return 'pending';
    }
  }

  private getAppointmentStatus(status: string, appointmentDate: string): TimelineEvent['status'] {
    const now = new Date();
    const appointment = new Date(appointmentDate);
    
    switch (status) {
      case 'completed': return 'completed';
      case 'cancelled': return 'overdue';
      case 'scheduled':
        if (appointment > now) return 'upcoming';
        return 'overdue';
      default: return 'pending';
    }
  }

  private getTaskStatus(status: string, dueDate: string | null): TimelineEvent['status'] {
    if (status === 'completed') return 'completed';
    
    if (dueDate) {
      const now = new Date();
      const due = new Date(dueDate);
      
      if (due > now) return 'upcoming';
      return 'overdue';
    }
    
    return 'pending';
  }

  private getActivityTitle(activityType: string): string {
    switch (activityType) {
      case 'medication_shared': return 'Shared medication';
      case 'member_joined': return 'Joined family group';
      case 'appointment_scheduled': return 'Scheduled appointment';
      case 'task_completed': return 'Completed task';
      case 'emergency_alert': return 'Emergency alert';
      default: return 'Family activity';
    }
  }

  private getActivityDescription(activityType: string, data: any, userName: string): string {
    switch (activityType) {
      case 'medication_shared': 
        return `${userName} shared ${data?.medication_name || 'a medication'} with the family`;
      case 'member_joined': 
        return `${userName} joined the family group`;
      case 'appointment_scheduled': 
        return `${userName} scheduled an appointment`;
      case 'task_completed': 
        return `${userName} completed a care task`;
      case 'emergency_alert': 
        return `${userName} sent an emergency alert`;
      default: 
        return `${userName} performed a family activity`;
    }
  }

  private getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}

export const enhancedFamilyCareTimelineService = new EnhancedFamilyCareTimelineService();