import React, { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';

interface MarkAllTakenButtonProps {
  pendingDoses: Array<{
    medicationId: string;
    medicationName: string;
    time: string;
  }>;
  onMarkAll: (doses: Array<{ medicationId: string; time: string }>) => Promise<void>;
  disabled?: boolean;
}

const MarkAllTakenButton: React.FC<MarkAllTakenButtonProps> = ({
  pendingDoses,
  onMarkAll,
  disabled = false
}) => {
  const { t } = useTranslation();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isMarking, setIsMarking] = useState(false);

  const handleMarkAll = async () => {
    setIsMarking(true);
    try {
      await onMarkAll(pendingDoses);
      toast.success('All doses marked as taken', {
        description: `Marked ${pendingDoses.length} ${pendingDoses.length === 1 ? 'dose' : 'doses'} as taken`
      });
      setShowConfirm(false);
    } catch (error) {
      console.error('Error marking all doses:', error);
      toast.error('Failed to mark all doses');
    } finally {
      setIsMarking(false);
    }
  };

  if (pendingDoses.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowConfirm(true)}
        disabled={disabled}
        className="rounded-xl"
      >
        <CheckCircle2 className="w-4 h-4 mr-2" />
        Mark All Taken ({pendingDoses.length})
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Mark All Doses as Taken?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>You're about to mark the following doses as taken:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {pendingDoses.map((dose, index) => (
                  <li key={index}>
                    <span className="font-medium">{dose.medicationName}</span> at {dose.time}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMarking} className="rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkAll}
              disabled={isMarking}
              className="rounded-xl"
            >
              {isMarking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Marking...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark All
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MarkAllTakenButton;
