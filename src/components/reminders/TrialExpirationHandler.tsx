import React, { useState, useEffect } from 'react';
import { AlertTriangle, Crown, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useReminders } from '@/hooks/useReminders';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { entitlementsService } from '@/services/entitlementsService';

interface TrialExpirationHandlerProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export function TrialExpirationHandler({ isOpen, onClose, onUpgrade }: TrialExpirationHandlerProps) {
  const { user } = useAuth();
  const { reminders, updateReminder } = useReminders();
  const { subscription, isInTrial, trialDaysRemaining } = useSubscription();
  const [selectedReminderId, setSelectedReminderId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Show modal when trial expires
  const shouldShow = isOpen && user && !isInTrial && subscription.plan === 'free' && reminders.length > 1;

  useEffect(() => {
    // Auto-select the most recent reminder by default
    if (shouldShow && reminders.length > 1) {
      const sortedReminders = [...reminders].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setSelectedReminderId(sortedReminders[0].id);
    }
  }, [shouldShow, reminders]);

  const handleKeepSelected = async () => {
    if (!selectedReminderId || !user) return;

    setIsProcessing(true);
    try {
      // Disable all reminders except the selected one
      const updatePromises = reminders.map(reminder => {
        if (reminder.id !== selectedReminderId) {
          return updateReminder(reminder.id, { is_active: false });
        }
        return Promise.resolve(true);
      });

      await Promise.all(updatePromises);
      onClose();
    } catch (error) {
      console.error('Error updating reminders:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!shouldShow) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Trial Expired</CardTitle>
              <p className="text-sm text-muted-foreground">Choose which reminder to keep</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your 14-day Pro trial has ended. Free users can only have 1 active reminder. 
              Choose which one to keep, or upgrade to Pro for unlimited reminders.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h4 className="font-medium">Select reminder to keep active:</h4>
            {reminders.map((reminder) => (
              <div key={reminder.id} className="flex items-start gap-3 p-3 rounded-lg border">
                <Checkbox
                  checked={selectedReminderId === reminder.id}
                  onCheckedChange={() => setSelectedReminderId(reminder.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
                      {reminder.medication?.medication_name || 'Unknown medication'}
                    </span>
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      {reminder.reminder_time}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {reminder.medication?.dosage}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-4">
            <Button
              onClick={onUpgrade}
              className="w-full bg-gradient-to-r from-primary to-primary-glow"
              size="lg"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Pro - Keep All Reminders
            </Button>
            <Button
              onClick={handleKeepSelected}
              disabled={!selectedReminderId || isProcessing}
              variant="outline"
              className="w-full"
            >
              {isProcessing ? 'Processing...' : 'Keep Selected Reminder (Free)'}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Other reminders will be paused but not deleted. You can reactivate them anytime with Pro.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}