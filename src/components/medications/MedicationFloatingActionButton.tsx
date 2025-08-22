import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MedicationFloatingActionButtonProps {
  onClick: () => void;
  className?: string;
}

const MedicationFloatingActionButton: React.FC<MedicationFloatingActionButtonProps> = ({
  onClick,
  className = '',
}) => {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className={`
        fixed bottom-24 right-4 z-50 
        w-14 h-14 rounded-full 
        shadow-lg hover:shadow-xl 
        transition-all duration-200 
        active:scale-95
        bg-primary hover:bg-primary/90
        ${className}
      `}
    >
      <Plus className="w-6 h-6" />
    </Button>
  );
};

export default MedicationFloatingActionButton;