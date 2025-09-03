import React, { useState, useEffect } from 'react';
import { Clock, Plus, User, AlertCircle, CheckCircle, XCircle, Calendar, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { careTaskService, CareTask, TaskTemplate } from '@/services/careTaskService';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface CareTasksManagerProps {
  familyGroupId: string;
  familyMembers: any[];
}

const CareTasksManager: React.FC<CareTasksManagerProps> = ({
  familyGroupId,
  familyMembers
}) => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<CareTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<CareTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');
  const [showCreateTask, setShowCreateTask] = useState(false);

  // Task creation form state
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    taskType: 'general' as CareTask['task_type'],
    priority: 'normal' as CareTask['priority'],
    assignedTo: '',
    dueDate: ''
  });

  const templates = careTaskService.getTaskTemplates();

  useEffect(() => {
    loadTasks();
  }, [familyGroupId]);

  useEffect(() => {
    filterTasks();
  }, [tasks, filter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const familyTasks = await careTaskService.getFamilyTasks(familyGroupId);
      const overdueTasks = await careTaskService.getOverdueTasks(familyGroupId);
      
      const allTasks = familyTasks.map(task => ({
        ...task,
        isOverdue: overdueTasks.some(t => t.id === task.id)
      }));
      
      setTasks(allTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to load care tasks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = () => {
    let filtered = tasks;
    switch (filter) {
      case 'pending':
        filtered = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
        break;
      case 'completed':
        filtered = tasks.filter(t => t.status === 'completed');
        break;
      case 'overdue':
        filtered = tasks.filter(t => (t as any).isOverdue);
        break;
      default:
        filtered = tasks;
    }
    setFilteredTasks(filtered);
  };

  const handleCreateTask = async () => {
    if (!taskForm.title || !taskForm.assignedTo) {
      toast({
        title: t('common.error'),
        description: 'Please fill in required fields',
        variant: 'destructive',
      });
      return;
    }

    const newTask = await careTaskService.createTask(
      familyGroupId,
      taskForm.title,
      taskForm.description,
      taskForm.taskType,
      taskForm.priority,
      taskForm.assignedTo,
      taskForm.dueDate || undefined
    );

    if (newTask) {
      setTasks(prev => [newTask, ...prev]);
      setShowCreateTask(false);
      resetForm();
      toast({
        title: 'Task Created',
        description: 'Care task has been created successfully',
      });
    }
  };

  const handleTaskStatusChange = async (taskId: string, status: CareTask['status']) => {
    const success = await careTaskService.updateTaskStatus(taskId, status);
    if (success) {
      loadTasks(); // Refresh tasks
    }
  };

  const handleUseTemplate = (template: TaskTemplate) => {
    setTaskForm({
      title: template.title,
      description: template.description,
      taskType: template.task_type,
      priority: template.priority,
      assignedTo: '',
      dueDate: ''
    });
  };

  const resetForm = () => {
    setTaskForm({
      title: '',
      description: '',
      taskType: 'general',
      priority: 'normal',
      assignedTo: '',
      dueDate: ''
    });
  };

  const getStatusIcon = (status: string, isOverdue?: boolean) => {
    if (isOverdue) return <AlertCircle className="w-4 h-4 text-destructive" />;
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Clock className="w-4 h-4 text-warning" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'high':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'normal':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'low':
        return 'bg-muted/10 text-muted-foreground border-muted/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getMemberName = (userId: string) => {
    const member = familyMembers.find(m => m.user_id === userId);
    return member?.profiles?.display_name || member?.email || 'Unknown';
  };

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Care Tasks</h3>
          <Badge variant="secondary">{tasks.length}</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="w-32">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>

          <Sheet open={showCreateTask} onOpenChange={setShowCreateTask}>
            <SheetTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Create Care Task</SheetTitle>
                <SheetDescription>
                  Assign a care task to a family member
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 mt-6">
                {/* Task Templates */}
                <div>
                  <Label>Quick Templates</Label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {templates.slice(0, 3).map((template) => (
                      <Button
                        key={template.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleUseTemplate(template)}
                        className="justify-start h-auto p-3"
                      >
                        <div className="text-left">
                          <div className="font-medium text-sm">{template.title}</div>
                          <div className="text-xs text-muted-foreground">{template.description}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Task Title *</Label>
                    <Input
                      id="title"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter task title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={taskForm.description}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Task description..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Task Type</Label>
                      <Select
                        value={taskForm.taskType}
                        onValueChange={(value: any) => setTaskForm(prev => ({ ...prev, taskType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="medication">Medication</SelectItem>
                          <SelectItem value="appointment">Appointment</SelectItem>
                          <SelectItem value="monitoring">Monitoring</SelectItem>
                          <SelectItem value="emergency">Emergency</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Priority</Label>
                      <Select
                        value={taskForm.priority}
                        onValueChange={(value: any) => setTaskForm(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Assign To *</Label>
                    <Select
                      value={taskForm.assignedTo}
                      onValueChange={(value) => setTaskForm(prev => ({ ...prev, assignedTo: value }))}
                    >
                      <SelectTrigger className="mt-2 h-12 text-base">
                        <SelectValue placeholder="Select family member" />
                      </SelectTrigger>
                      <SelectContent>
                        {familyMembers.map((member) => (
                          <SelectItem key={member.user_id} value={member.user_id}>
                            {member.profiles?.display_name || member.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dueDate" className="text-base font-medium">Due Date (Optional)</Label>
                    <Input
                      id="dueDate"
                      type="datetime-local"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="mt-2 h-12 text-base"
                    />
                  </div>

                  <div className="flex flex-col gap-3 pt-6">
                    <Button onClick={handleCreateTask} className="h-12 text-base font-medium">
                      Create Task
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateTask(false)} className="h-12 text-base">
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No care tasks found</p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(task.status, (task as any).isOverdue)}
                      <h4 className="font-medium">{task.title}</h4>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {getMemberName(task.assigned_to)}
                      </div>
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(task.due_date), 'MMM dd, HH:mm')}
                        </div>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {task.task_type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-4">
                    {task.status !== 'completed' && task.status !== 'cancelled' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTaskStatusChange(task.id, 'completed')}
                          className="h-7 px-2"
                        >
                          <CheckCircle className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTaskStatusChange(task.id, 'cancelled')}
                          className="h-7 px-2"
                        >
                          <XCircle className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CareTasksManager;