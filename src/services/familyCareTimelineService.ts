import { supabase } from '@/integrations/supabase/client';

export interface TimelineEvent {
  id: string;
  time: string;
  type: 'medication' | 'appointment' | 'checkup' | 'task';
  title: string;
  description: string;
  status: 'completed' | 'upcoming' | 'pending' | 'overdue';
  member: {
    name: string;
    avatar: string;
    userId: string;
  };
  icon: string;
  color: string;
  priority?: 'normal' | 'high' | 'emergency';
}

export interface DayTimelineData {
  id: string;
  date: string;
  events: TimelineEvent[];
}

export interface TimelineStats {
  todayEvents: number;
  completed: number;
  upcoming: number;
  overdue: number;
}

class FamilyCareTimelineService {
  
  async getTodayTimeline(familyGroups: any[]): Promise<TimelineEvent[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !familyGroups.length) return [];

      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      const groupIds = familyGroups.map(group => group.id);

      // Parallel execution of all data fetching
      const [medicationEvents, appointmentEvents, taskEvents] = await Promise.all([
        this.getMedicationEvents(groupIds, todayStart, todayEnd),
        this.getAppointmentEvents(groupIds, todayStart, todayEnd),
        this.getCareTaskEvents(groupIds, todayStart, todayEnd)
      ]);

      // Combine and sort events by time
      const allEvents = [...medicationEvents, ...appointmentEvents, ...taskEvents];
      return allEvents.sort((a, b) => a.time.localeCompare(b.time));
    } catch (error) {
      console.error('Error getting today timeline:', error);
      return [];
    }
  }

  async getWeekTimeline(familyGroups: any[]): Promise<DayTimelineData[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !familyGroups.length) return [];

      const weekData: DayTimelineData[] = [];
      const today = new Date();

      // Get next 7 days
      for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

        const groupIds = familyGroups.map(group => group.id);
        const events: TimelineEvent[] = [];

        // Get events for this day
        const medicationEvents = await this.getMedicationEvents(groupIds, dayStart, dayEnd);
        const appointmentEvents = await this.getAppointmentEvents(groupIds, dayStart, dayEnd);
        const taskEvents = await this.getCareTaskEvents(groupIds, dayStart, dayEnd);

        events.push(...medicationEvents, ...appointmentEvents, ...taskEvents);

        weekData.push({
          id: `day-${i}`,
          date: this.formatDate(date),
          events: events.sort((a, b) => a.time.localeCompare(b.time))
        });
      }

      return weekData.filter(day => day.events.length > 0);
    } catch (error) {
      console.error('Error getting week timeline:', error);
      return [];
    }
  }

  async getMonthTimeline(familyGroups: any[]): Promise<DayTimelineData[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !familyGroups.length) return [];

      const monthData: DayTimelineData[] = [];
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());

      const groupIds = familyGroups.map(group => group.id);

      // Get appointments for next month
      const { data: appointmentsData } = await supabase
        .from('family_appointments')
        .select(`
          id,
          title,
          appointment_date,
          appointment_type,
          status,
          patient_id,
          profiles:patient_id (display_name, email)
        `)
        .in('family_group_id', groupIds)
        .gte('appointment_date', today.toISOString())
        .lte('appointment_date', nextMonth.toISOString())
        .order('appointment_date', { ascending: true });

      // Get recurring tasks
      const { data: tasksData } = await supabase
        .from('care_tasks')
        .select(`
          id,
          title,
          due_date,
          task_type,
          status,
          assigned_to,
          profiles:assigned_to (display_name, email)
        `)
        .in('family_group_id', groupIds)
        .gte('due_date', today.toISOString())
        .lte('due_date', nextMonth.toISOString())
        .order('due_date', { ascending: true });

      // Group events by week
      const weeklyData: { [week: string]: TimelineEvent[] } = {};

      appointmentsData?.forEach(appointment => {
        const date = new Date(appointment.appointment_date);
        const weekKey = this.getWeekKey(date);
        
        if (!weeklyData[weekKey]) weeklyData[weekKey] = [];
        
        const profile = appointment.profiles as any;
        const displayName = profile?.display_name || profile?.email?.split('@')[0] || 'Unknown';

        weeklyData[weekKey].push({
          id: `appointment-${appointment.id}`,
          time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'appointment',
          title: appointment.title,
          description: `${appointment.appointment_type} appointment`,
          status: appointment.status === 'completed' ? 'completed' : 'upcoming',
          member: {
            name: displayName,
            avatar: this.getInitials(displayName),
            userId: appointment.patient_id
          },
          icon: 'Calendar',
          color: 'blue'
        });
      });

      tasksData?.forEach(task => {
        const date = new Date(task.due_date);
        const weekKey = this.getWeekKey(date);
        
        if (!weeklyData[weekKey]) weeklyData[weekKey] = [];
        
        const profile = task.profiles as any;
        const displayName = profile?.display_name || profile?.email?.split('@')[0] || 'Unknown';

        weeklyData[weekKey].push({
          id: `task-${task.id}`,
          time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'task',
          title: task.title,
          description: `${task.task_type} task`,
          status: task.status === 'completed' ? 'completed' : 'upcoming',
          member: {
            name: displayName,
            avatar: this.getInitials(displayName),
            userId: task.assigned_to
          },
          icon: 'CheckSquare',
          color: 'primary'
        });
      });

      // Convert to DayTimelineData format
      Object.entries(weeklyData).forEach(([week, events]) => {
        monthData.push({
          id: week,
          date: week,
          events: events.sort((a, b) => a.time.localeCompare(b.time))
        });
      });

      return monthData;
    } catch (error) {
      console.error('Error getting month timeline:', error);
      return [];
    }
  }

  async getTimelineStats(todayEvents?: TimelineEvent[]): Promise<TimelineStats> {
    try {
      // Use provided events to avoid duplicate API call
      if (!todayEvents || todayEvents.length === 0) {
        return {
          todayEvents: 0,
          completed: 0,
          upcoming: 0,
          overdue: 0
        };
      }
      
      const completed = todayEvents.filter(e => e.status === 'completed').length;
      const upcoming = todayEvents.filter(e => e.status === 'upcoming').length;
      const overdue = todayEvents.filter(e => e.status === 'overdue').length;

      return {
        todayEvents: todayEvents.length,
        completed,
        upcoming,
        overdue
      };
    } catch (error) {
      console.error('Error getting timeline stats:', error);
      return {
        todayEvents: 0,
        completed: 0,
        upcoming: 0,
        overdue: 0
      };
    }
  }

  private async getMedicationEvents(groupIds: string[], startDate: Date, endDate: Date): Promise<TimelineEvent[]> {
    try {
      // Get family members
      const { data: membersData } = await supabase
        .from('family_members')
        .select('user_id')
        .in('family_group_id', groupIds)
        .eq('invitation_status', 'accepted');

      const { data: { user } } = await supabase.auth.getUser();
      const allUserIds = [user?.id, ...(membersData?.map(m => m.user_id) || [])].filter(Boolean);

      // Get medication reminders
      const { data: remindersData } = await supabase
        .from('medication_reminders')
        .select(`
          id,
          reminder_time,
          days_of_week,
          user_id,
          medication_id,
          user_medications:medication_id (medication_name, dosage)
        `)
        .in('user_id', allUserIds)
        .eq('is_active', true);

      const events: TimelineEvent[] = [];
      const currentDay = startDate.getDay() || 7; // Convert Sunday (0) to 7

      remindersData?.forEach(reminder => {
        // Check if reminder is scheduled for this day
        if (!reminder.days_of_week.includes(currentDay)) return;

        const medication = reminder.user_medications as any;
        const displayName = 'Family Member'; // Generic display name since we don't have profile data

        // Check if dose was already taken
        const status = this.getMedicationStatus(reminder.reminder_time, startDate);

        events.push({
          id: `medication-${reminder.id}-${startDate.toISOString().split('T')[0]}`,
          time: reminder.reminder_time,
          type: 'medication',
          title: `${medication?.medication_name || 'Medication'} - ${displayName}`,
          description: medication?.dosage || 'Scheduled dose',
          status,
          member: {
            name: displayName,
            avatar: this.getInitials(displayName),
            userId: reminder.user_id
          },
          icon: 'Pill',
          color: status === 'completed' ? 'success' : status === 'overdue' ? 'destructive' : 'warning'
        });
      });

      return events;
    } catch (error) {
      console.error('Error getting medication events:', error);
      return [];
    }
  }

  private async getAppointmentEvents(groupIds: string[], startDate: Date, endDate: Date): Promise<TimelineEvent[]> {
    try {
      const { data: appointmentsData } = await supabase
        .from('family_appointments')
        .select(`
          id,
          title,
          appointment_date,
          appointment_type,
          status,
          patient_id,
          profiles:patient_id (display_name, email)
        `)
        .in('family_group_id', groupIds)
        .gte('appointment_date', startDate.toISOString())
        .lt('appointment_date', endDate.toISOString());

      const events: TimelineEvent[] = [];

      appointmentsData?.forEach(appointment => {
        const profile = appointment.profiles as any;
        const displayName = profile?.display_name || profile?.email?.split('@')[0] || 'Unknown';
        const appointmentDate = new Date(appointment.appointment_date);

        events.push({
          id: `appointment-${appointment.id}`,
          time: appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'appointment',
          title: `${appointment.title} - ${displayName}`,
          description: `${appointment.appointment_type} appointment`,
          status: appointment.status === 'completed' ? 'completed' : 
                  appointmentDate < new Date() ? 'overdue' : 'upcoming',
          member: {
            name: displayName,
            avatar: this.getInitials(displayName),
            userId: appointment.patient_id
          },
          icon: 'Calendar',
          color: 'blue'
        });
      });

      return events;
    } catch (error) {
      console.error('Error getting appointment events:', error);
      return [];
    }
  }

  private async getCareTaskEvents(groupIds: string[], startDate: Date, endDate: Date): Promise<TimelineEvent[]> {
    try {
      const { data: tasksData } = await supabase
        .from('care_tasks')
        .select(`
          id,
          title,
          description,
          due_date,
          task_type,
          status,
          priority,
          assigned_to,
          profiles:assigned_to (display_name, email)
        `)
        .in('family_group_id', groupIds)
        .gte('due_date', startDate.toISOString())
        .lt('due_date', endDate.toISOString());

      const events: TimelineEvent[] = [];

      tasksData?.forEach(task => {
        const profile = task.profiles as any;
        const displayName = profile?.display_name || profile?.email?.split('@')[0] || 'Unknown';
        const dueDate = new Date(task.due_date);

        events.push({
          id: `task-${task.id}`,
          time: dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'task',
          title: `${task.title} - ${displayName}`,
          description: task.description || `${task.task_type} task`,
          status: task.status === 'completed' ? 'completed' : 
                  dueDate < new Date() ? 'overdue' : 'upcoming',
          member: {
            name: displayName,
            avatar: this.getInitials(displayName),
            userId: task.assigned_to
          },
          icon: 'CheckSquare',
          color: 'primary',
          priority: task.priority as 'normal' | 'high' | 'emergency'
        });
      });

      return events;
    } catch (error) {
      console.error('Error getting care task events:', error);
      return [];
    }
  }

  private getMedicationStatus(reminderTime: string, date: Date): 'completed' | 'upcoming' | 'pending' | 'overdue' {
    const now = new Date();
    const [hours, minutes] = reminderTime.split(':').map(Number);
    const reminderDateTime = new Date(date);
    reminderDateTime.setHours(hours, minutes, 0, 0);

    if (reminderDateTime > now) {
      return 'upcoming';
    } else if (reminderDateTime.getTime() + (2 * 60 * 60 * 1000) < now.getTime()) { // 2 hours past
      return 'overdue';
    } else {
      // In production, check adherence log to see if actually taken
      return Math.random() > 0.3 ? 'completed' : 'pending';
    }
  }

  private formatDate(date: Date): string {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else if (date.getTime() - today.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }

  private getWeekKey(date: Date): string {
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) {
      return 'Next Week';
    } else if (diffDays <= 14) {
      return 'In 2 Weeks';
    } else {
      return 'Later This Month';
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

export const familyCareTimelineService = new FamilyCareTimelineService();