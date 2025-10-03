import React, { useState } from 'react';
import { Plus, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MedicationFloatingActionButtonProps {
  onAddMedication: () => void;
  onScanBarcode?: () => void;
  className?: string;
}

const MedicationFloatingActionButton: React.FC<MedicationFloatingActionButtonProps> = ({
  onAddMedication,
  onScanBarcode,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMainClick = () => {
    if (onScanBarcode) {
      setIsExpanded(!isExpanded);
    } else {
      onAddMedication();
    }
  };

  return (
    <div className={cn('fixed bottom-24 right-4 z-50', className)}>
      {/* Expanded Options */}
      {isExpanded && onScanBarcode && (
        <div className="absolute bottom-20 right-0 flex flex-col gap-3 mb-2 animate-fade-in">
          <Button
            onClick={() => {
              onScanBarcode();
              setIsExpanded(false);
            }}
            size="lg"
            variant="secondary"
            className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
          >
            <Scan className="w-6 h-6" />
          </Button>
          <Button
            onClick={() => {
              onAddMedication();
              setIsExpanded(false);
            }}
            size="lg"
            variant="secondary"
            className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      )}

      {/* Main FAB */}
      <Button
        onClick={handleMainClick}
        size="lg"
        className={cn(
          'w-14 h-14 rounded-full shadow-lg hover:shadow-xl',
          'transition-all duration-200 active:scale-95',
          'bg-primary hover:bg-primary/90',
          isExpanded && 'rotate-45'
        )}
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
};

export default MedicationFloatingActionButton;