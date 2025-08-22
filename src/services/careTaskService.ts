import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CareTask {
  id: string;
  family_group_id: string;
  title: string;
  description?: string;
  task_type: 'medication' | 'appointment' | 'monitoring' | 'emergency' | 'general';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assigned_to: string;
  assigned_by: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  assignee?: any;
  assigner?: any;
}

export interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  task_type: CareTask['task_type'];
  priority: CareTask['priority'];
  estimatedDuration?: number; // in minutes
  instructions?: string[];
  requiredPermissions?: string[];
}

export class CareTaskService {
  async createTask(
    familyGroupId: string,
    title: string,
    description: string,
    taskType: CareTask['task_type'],
    priority: CareTask['priority'],
    assignedTo: string,
    dueDate?: string
  ): Promise<CareTask | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('care_tasks')
        .insert({
          family_group_id: familyGroupId,
          title,
          description,
          task_type: taskType,
          priority,
          assigned_to: assignedTo,
          assigned_by: user.id,
          due_date: dueDate,
          status: 'pending'
        })
        .select(`
          *,
          assignee:profiles!care_tasks_assigned_to_fkey(display_name, email, avatar_url),
          assigner:profiles!care_tasks_assigned_by_fkey(display_name, email, avatar_url)
        `)
        .single();

      if (error) throw error;

      const typedData = data as CareTask;

      // Send notification to assigned user
      await this.notifyTaskAssignment(typedData, familyGroupId);

      toast.success('Care task created successfully');
      return typedData;
    } catch (error) {
      console.error('Error creating care task:', error);
      toast.error('Failed to create care task');
      return null;
    }
  }

  async getFamilyTasks(familyGroupId: string, status?: CareTask['status']): Promise<CareTask[]> {
    try {
      let query = supabase
        .from('care_tasks')
        .select(`
          *,
          assignee:profiles!care_tasks_assigned_to_fkey(display_name, email, avatar_url),
          assigner:profiles!care_tasks_assigned_by_fkey(display_name, email, avatar_url)
        `)
        .eq('family_group_id', familyGroupId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as CareTask[];
    } catch (error) {
      console.error('Error fetching family tasks:', error);
      return [];
    }
  }

  async getMyTasks(status?: CareTask['status']): Promise<CareTask[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('care_tasks')
        .select(`
          *,
          assignee:profiles!care_tasks_assigned_to_fkey(display_name, email, avatar_url),
          assigner:profiles!care_tasks_assigned_by_fkey(display_name, email, avatar_url)
        `)
        .eq('assigned_to', user.id)
        .order('due_date', { ascending: true });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as CareTask[];
    } catch (error) {
      console.error('Error fetching my tasks:', error);
      return [];
    }
  }

  async updateTaskStatus(
    taskId: string,
    status: CareTask['status'],
    notes?: string
  ): Promise<boolean> {
    try {
      const updates: any = { status };
      
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('care_tasks')
        .update(updates)
        .eq('id', taskId)
        .select('family_group_id, assigned_by, title')
        .single();

      if (error) throw error;

      // Notify assigner if task is completed
      if (status === 'completed' && data) {
        await this.notifyTaskCompletion(data, notes);
      }

      // Log activity
      await this.logTaskActivity(taskId, status, notes);

      toast.success(`Task marked as ${status.replace('_', ' ')}`);
      return true;
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
      return false;
    }
  }

  async reassignTask(taskId: string, newAssigneeId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('care_tasks')
        .update({ assigned_to: newAssigneeId })
        .eq('id', taskId);

      if (error) throw error;

      // Get task details for notification
      const { data: task } = await supabase
        .from('care_tasks')
        .select(`
          *,
          assignee:profiles!care_tasks_assigned_to_fkey(display_name, email),
          assigner:profiles!care_tasks_assigned_by_fkey(display_name, email)
        `)
        .eq('id', taskId)
        .single();

      if (task) {
        await this.notifyTaskReassignment(task);
      }

      toast.success('Task reassigned successfully');
      return true;
    } catch (error) {
      console.error('Error reassigning task:', error);
      toast.error('Failed to reassign task');
      return false;
    }
  }

  async deleteTask(taskId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('care_tasks')
        .update({ status: 'cancelled' })
        .eq('id', taskId);

      if (error) throw error;

      toast.success('Task cancelled');
      return true;
    } catch (error) {
      console.error('Error cancelling task:', error);
      toast.error('Failed to cancel task');
      return false;
    }
  }

  async getTasksByPriority(familyGroupId: string): Promise<Record<string, CareTask[]>> {
    try {
      const tasks = await this.getFamilyTasks(familyGroupId);
      
      return {
        urgent: tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed'),
        high: tasks.filter(t => t.priority === 'high' && t.status !== 'completed'),
        normal: tasks.filter(t => t.priority === 'normal' && t.status !== 'completed'),
        low: tasks.filter(t => t.priority === 'low' && t.status !== 'completed')
      };
    } catch (error) {
      console.error('Error getting tasks by priority:', error);
      return { urgent: [], high: [], normal: [], low: [] };
    }
  }

  async getOverdueTasks(familyGroupId: string): Promise<CareTask[]> {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('care_tasks')
        .select(`
          *,
          assignee:profiles!care_tasks_assigned_to_fkey(display_name, email, avatar_url),
          assigner:profiles!care_tasks_assigned_by_fkey(display_name, email, avatar_url)
        `)
        .eq('family_group_id', familyGroupId)
        .in('status', ['pending', 'in_progress'])
        .lt('due_date', now)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching overdue tasks:', error);
      return [];
    }
  }

  async createFromTemplate(
    familyGroupId: string,
    template: TaskTemplate,
    assignedTo: string,
    dueDate?: string
  ): Promise<CareTask | null> {
    return this.createTask(
      familyGroupId,
      template.title,
      template.description,
      template.task_type,
      template.priority,
      assignedTo,
      dueDate
    );
  }

  getTaskTemplates(): TaskTemplate[] {
    return [
      {
        id: 'medication-reminder',
        title: 'Medication Reminder Check',
        description: 'Verify medication was taken as prescribed',
        task_type: 'medication',
        priority: 'high',
        estimatedDuration: 5,
        instructions: [
          'Check if medication was taken on time',
          'Ask about any side effects',
          'Record the interaction'
        ]
      },
      {
        id: 'appointment-preparation',
        title: 'Prepare for Medical Appointment',
        description: 'Help prepare for upcoming doctor visit',
        task_type: 'appointment',
        priority: 'normal',
        estimatedDuration: 30,
        instructions: [
          'Gather medical records',
          'Prepare list of questions',
          'Confirm appointment time',
          'Arrange transportation'
        ]
      },
      {
        id: 'wellness-check',
        title: 'Daily Wellness Check',
        description: 'Check on general health and wellbeing',
        task_type: 'monitoring',
        priority: 'normal',
        estimatedDuration: 10,
        instructions: [
          'Ask about pain levels',
          'Check for any new symptoms',
          'Assess mood and mental state',
          'Review medication adherence'
        ]
      },
      {
        id: 'emergency-contact',
        title: 'Emergency Contact Response',
        description: 'Respond to emergency alert',
        task_type: 'emergency',
        priority: 'urgent',
        estimatedDuration: 0,
        instructions: [
          'Contact immediately',
          'Assess situation',
          'Provide necessary assistance',
          'Follow up as needed'
        ]
      }
    ];
  }

  private async notifyTaskAssignment(task: CareTask, familyGroupId: string): Promise<void> {
    try {
      await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: task.assigned_to,
          title: '📋 New Care Task Assigned',
          body: `You have been assigned: ${task.title}`,
          data: {
            type: 'task_assigned',
            task_id: task.id,
            family_group_id: familyGroupId,
            priority: task.priority
          }
        }
      });
    } catch (error) {
      console.error('Error notifying task assignment:', error);
    }
  }

  private async notifyTaskCompletion(task: any, notes?: string): Promise<void> {
    try {
      await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: task.assigned_by,
          title: '✅ Task Completed',
          body: `Task completed: ${task.title}`,
          data: {
            type: 'task_completed',
            task_id: task.id,
            family_group_id: task.family_group_id,
            notes
          }
        }
      });
    } catch (error) {
      console.error('Error notifying task completion:', error);
    }
  }

  private async notifyTaskReassignment(task: CareTask): Promise<void> {
    try {
      await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: task.assigned_to,
          title: '📋 Task Reassigned to You',
          body: `You have been assigned: ${task.title}`,
          data: {
            type: 'task_reassigned',
            task_id: task.id,
            family_group_id: task.family_group_id
          }
        }
      });
    } catch (error) {
      console.error('Error notifying task reassignment:', error);
    }
  }

  private async logTaskActivity(taskId: string, status: string, notes?: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get task details
      const { data: task } = await supabase
        .from('care_tasks')
        .select('family_group_id')
        .eq('id', taskId)
        .single();

      if (task) {
        await supabase
          .from('family_activity_log')
          .insert({
            user_id: user.id,
            family_group_id: task.family_group_id,
            activity_type: 'task_update',
            activity_data: {
              task_id: taskId,
              status,
              notes
            },
            priority: 'normal'
          });
      }
    } catch (error) {
      console.error('Error logging task activity:', error);
    }
  }
}

export const careTaskService = new CareTaskService();