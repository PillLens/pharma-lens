import { Button } from "@/components/ui/button";
import { Pause, Play, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface BulkActionsBarProps {
  selectedCount: number;
  onPause: () => void;
  onActivate: () => void;
  onDelete: () => void;
  onCancel: () => void;
  isPausing?: boolean;
  isActivating?: boolean;
  isDeleting?: boolean;
}

export const BulkActionsBar = ({
  selectedCount,
  onPause,
  onActivate,
  onDelete,
  onCancel,
  isPausing,
  isActivating,
  isDeleting
}: BulkActionsBarProps) => {
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 px-4 pb-safe">
      <div className="bg-card border border-border rounded-2xl shadow-lg p-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="h-10 w-10"
            >
              <X className="h-5 w-5" />
            </Button>
            <span className="text-sm font-medium">
              {selectedCount} {t('reminders.selected', 'selected')}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPause}
              disabled={isPausing || isActivating || isDeleting}
              className="gap-2"
            >
              <Pause className="h-4 w-4" />
              {t('reminders.pause', 'Pause')}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onActivate}
              disabled={isPausing || isActivating || isDeleting}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              {t('reminders.activate', 'Activate')}
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={isPausing || isActivating || isDeleting}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {t('common.delete', 'Delete')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};