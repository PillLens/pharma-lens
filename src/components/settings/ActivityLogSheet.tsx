import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Loader2 } from 'lucide-react';
import { activityLogService, ActivityLog } from '@/services/activityLogService';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ActivityLogSheetProps {
  open: boolean;
  onClose: () => void;
}

export function ActivityLogSheet({ open, onClose }: ActivityLogSheetProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadActivities();
    }
  }, [open]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await activityLogService.getActivityLog(100);
      setActivities(data);
    } catch (error) {
      console.error('Error loading activity log:', error);
      toast.error('Failed to load activity log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Activity Log</SheetTitle>
          <SheetDescription>
            Recent account activities and security events
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : activities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No recent activity</p>
          ) : (
            <div className="space-y-2">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                >
                  <span className="text-2xl mt-0.5">
                    {activityLogService.getActivityIcon(activity.activity_type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${activityLogService.getActivityColor(activity.activity_type)}`}>
                      {activityLogService.formatActivityType(activity.activity_type)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(activity.created_at), 'PPp')}
                    </p>
                    {activity.activity_data && Object.keys(activity.activity_data).length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {JSON.stringify(activity.activity_data)}
                      </p>
                    )}
                    {activity.ip_address && (
                      <p className="text-xs text-muted-foreground">
                        IP: {activity.ip_address}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
