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
        "fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full shadow-floating bg-primary hover:bg-primary/90",
        className
      )}
    >
      <Camera className="w-6 h-6" />
    </MobileButton>
  );
};

export default FloatingActionButton;