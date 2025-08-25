import React, { useState } from 'react';
import { Camera, Scan, Plus, X } from 'lucide-react';
import { MobileButton } from '@/components/ui/mobile/MobileButton';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  onClick: () => void;
  className?: string;
  variant?: 'scan' | 'menu';
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  className,
  variant = 'scan'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    if (variant === 'menu') {
      setIsExpanded(!isExpanded);
    } else {
      onClick();
    }
  };

  if (variant === 'menu') {
    return (
      <div className="fixed bottom-28 right-4 z-50">
        {/* Backdrop */}
        {isExpanded && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
            onClick={() => setIsExpanded(false)}
          />
        )}
        
        {/* Action Menu */}
        <div className={cn(
          "flex flex-col-reverse gap-3 transition-all duration-300 ease-out",
          isExpanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"
        )}>
          <MobileButton
            onClick={() => {
              onClick();
              setIsExpanded(false);
            }}
            size="icon"
            variant="medical"
            className="w-12 h-12 rounded-full shadow-floating"
          >
            <Camera className="w-5 h-5" />
          </MobileButton>
          
          <MobileButton
            onClick={() => {
              // Handle scan action
              setIsExpanded(false);
            }}
            size="icon"
            variant="glass"
            className="w-12 h-12 rounded-full shadow-floating"
          >
            <Scan className="w-5 h-5" />
          </MobileButton>
        </div>

        {/* Main FAB */}
        <MobileButton
          onClick={handleClick}
          size="icon"
          className={cn(
            "w-16 h-16 rounded-full shadow-floating transition-all duration-300",
        "medical-button hover-scale-desktop active:scale-95",
            isExpanded 
              ? "bg-destructive text-destructive-foreground shadow-destructive/20" 
              : "animate-medical-pulse",
            className
          )}
        >
          <div className="relative">
            <Plus className={cn(
              "w-7 h-7 transition-transform duration-300",
              isExpanded && "rotate-45"
            )} />
            {!isExpanded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
              </div>
            )}
          </div>
        </MobileButton>
      </div>
    );
  }

  return (
    <MobileButton
      onClick={onClick}
      size="icon"
      className={cn(
        "fixed bottom-28 right-4 z-50 w-16 h-16 rounded-full shadow-floating",
        "medical-button hover-scale-desktop active:scale-95",
        "transition-all duration-300 group",
        className
      )}
    >
      <div className="relative">
        <Camera className="w-7 h-7 transition-transform duration-300 group-active:scale-90" />
        
        {/* Scanning indicator */}
        <div className="absolute -inset-2 rounded-full border-2 border-primary/30 animate-medical-pulse" />
        
        {/* Pulse dot */}
        <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-ping" />
      </div>
    </MobileButton>
  );
};

export default FloatingActionButton;