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
import { toast } from 'sonner';

interface TrialExpirationHandlerProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onSuccess?: () => void;
}

export function TrialExpirationHandler({ isOpen, onClose, onUpgrade, onSuccess }: TrialExpirationHandlerProps) {
  const { user } = useAuth();
  const { reminders, updateReminder } = useReminders();
  const { subscription, isInTrial, trialDaysRemaining } = useSubscription();
  const [selectedReminderId, setSelectedReminderId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Show modal when trial expires - only if user has more than 1 ACTIVE reminder
  const activeReminders = reminders.filter(r => r.is_active);
  const shouldShow = isOpen && user && !isInTrial && subscription.plan === 'free' && activeReminders.length > 1;

  useEffect(() => {
    // Auto-select the most recent active reminder by default
    if (shouldShow && activeReminders.length > 1) {
      const sortedActiveReminders = [...activeReminders].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setSelectedReminderId(sortedActiveReminders[0].id);
    }
  }, [shouldShow, activeReminders]);

  const handleKeepSelected = async () => {
    if (!selectedReminderId || !user) return;

    setIsProcessing(true);
    try {
      // Import smart deletion service
      const { SmartTrialDeletionService } = await import('@/services/smartTrialDeletionService');
      
      // Perform smart deletion
      const result = await SmartTrialDeletionService.handleTrialExpirationDeletion(
        selectedReminderId,
        reminders,
        user.id
      );

      // Store that user has handled trial expiration
      const handledKey = `trial_handled_${user.id}`;
      localStorage.setItem(handledKey, Date.now().toString());
      
      // Generate success message
      const message = SmartTrialDeletionService.generateSummaryMessage(result);
      toast.success(message);
      
      onClose();
      onSuccess?.();
      
    } catch (error) {
      console.error('Error processing trial expiration:', error);
      toast.error('Failed to process your selection. Please try again.');
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
              Choose which one to keep - <strong>other reminders and unused medications will be permanently deleted</strong>. 
              Shared medications and those with history will be preserved.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h4 className="font-medium">Select reminder to keep active:</h4>
            {activeReminders.map((reminder) => (
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
              {isProcessing ? 'Deleting Others...' : 'Keep Selected & Delete Others (Free)'}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Unselected reminders will be permanently deleted. Medications with family sharing or substantial usage history will be preserved.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}