import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle, Pause, Play, Edit, Trash2, Bell } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface ReminderHistoryEntry {
  id: string;
  action_type: string;
  action_data: any;
  created_at: string;
  medication_name?: string;
}

export const ReminderHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<ReminderHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;
    
    try {
      // Fetch reminder history
      const { data: historyData, error: historyError } = await supabase
        .from('reminder_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (historyError) throw historyError;

      // Fetch medication names separately
      const medicationIds = [...new Set(historyData.map(h => h.medication_id))];
      const { data: medications } = await supabase
        .from('user_medications')
        .select('id, medication_name')
        .in('id', medicationIds);

      const medicationMap = new Map(
        medications?.map(m => [m.id, m.medication_name]) || []
      );

      setHistory(historyData.map(item => ({
        ...item,
        medication_name: medicationMap.get(item.medication_id)
      })));
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'taken':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'missed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-warning" />;
      case 'activated':
        return <Play className="h-4 w-4 text-primary" />;
      case 'created':
        return <Bell className="h-4 w-4 text-primary" />;
      case 'updated':
        return <Edit className="h-4 w-4 text-muted-foreground" />;
      case 'deleted':
        return <Trash2 className="h-4 w-4 text-destructive" />;
      case 'snoozed':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      taken: 'Dose Taken',
      missed: 'Dose Missed',
      paused: 'Reminder Paused',
      activated: 'Reminder Activated',
      created: 'Reminder Created',
      updated: 'Reminder Updated',
      deleted: 'Reminder Deleted',
      snoozed: 'Reminder Snoozed'
    };
    return labels[actionType] || actionType;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-1">No History Yet</h3>
        <p className="text-sm text-muted-foreground">
          Your reminder activity will appear here
        </p>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[500px] pr-4">
      <div className="space-y-3">
        {history.map((entry) => (
          <Card key={entry.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {getActionIcon(entry.action_type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {getActionLabel(entry.action_type)}
                  </Badge>
                  {entry.medication_name && (
                    <span className="text-sm font-medium truncate">
                      {entry.medication_name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                </p>
                {entry.action_data && Object.keys(entry.action_data).length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {entry.action_data.notes && (
                      <p>{entry.action_data.notes}</p>
                    )}
                    {entry.action_data.snooze_until && (
                      <p>Snoozed until: {format(new Date(entry.action_data.snooze_until), 'h:mm a')}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};