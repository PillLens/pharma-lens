import React from 'react';
import { Camera } from 'lucide-react';
import { MobileButton } from '@/components/ui/mobile/MobileButton';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  onClick: () => void;
  className?: string;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  className
}) => {
  return (
    <MobileButton
      onClick={onClick}
      size="icon"
      className={cn(
        "fixed bottom-28 right-4 z-50 w-16 h-16 rounded-full shadow-floating",
        "medical-button hover:scale-110 active:scale-95",
        "animate-medical-pulse transition-all duration-200",
        className
      )}
    >
      <Camera className="w-7 h-7" />
    </MobileButton>
  );
};

export default FloatingActionButton;