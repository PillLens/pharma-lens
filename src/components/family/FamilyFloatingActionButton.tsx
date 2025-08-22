import React from 'react';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FamilyFloatingActionButtonProps {
  onClick: () => void;
  className?: string;
}

const FamilyFloatingActionButton: React.FC<FamilyFloatingActionButtonProps> = ({
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
      <Users className="w-6 h-6" />
    </Button>
  );
};

export default FamilyFloatingActionButton;