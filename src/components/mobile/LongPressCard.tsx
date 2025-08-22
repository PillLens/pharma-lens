import React, { useRef, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { hapticService } from '@/services/hapticService';
import { cn } from '@/lib/utils';

interface LongPressCardProps extends React.ComponentProps<typeof Card> {
  children: React.ReactNode;
  onLongPress?: () => void;
  longPressDelay?: number;
  quickActions?: Array<{
    label: string;
    icon: React.ReactNode;
    action: () => void;
    color?: string;
  }>;
  pressScale?: boolean;
  enableHaptics?: boolean;
}

export const LongPressCard: React.FC<LongPressCardProps> = ({
  children,
  onLongPress,
  longPressDelay = 500,
  quickActions = [],
  pressScale = true,
  enableHaptics = true,
  className,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const pressStartTime = useRef<number>(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    pressStartTime.current = Date.now();
    setIsPressed(true);
    
    if (enableHaptics) {
      hapticService.feedback('light');
    }

    if (onLongPress || quickActions.length > 0) {
      longPressTimer.current = setTimeout(() => {
        if (enableHaptics) {
          hapticService.longPress();
        }
        
        if (quickActions.length > 0) {
          setShowQuickActions(true);
        } else if (onLongPress) {
          onLongPress();
        }
        
        setIsPressed(false);
      }, longPressDelay);
    }
  }, [onLongPress, quickActions, longPressDelay, enableHaptics]);

  const handleTouchEnd = useCallback(() => {
    const pressDuration = Date.now() - pressStartTime.current;
    
    setIsPressed(false);
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // If it was a quick tap and quick actions are showing, hide them
    if (pressDuration < longPressDelay && showQuickActions) {
      setShowQuickActions(false);
    }
  }, [longPressDelay, showQuickActions]);

  const handleTouchCancel = useCallback(() => {
    setIsPressed(false);
    setShowQuickActions(false);
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleQuickAction = useCallback((action: () => void) => {
    if (enableHaptics) {
      hapticService.buttonPress();
    }
    action();
    setShowQuickActions(false);
  }, [enableHaptics]);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
      setShowQuickActions(false);
    }
  }, []);

  React.useEffect(() => {
    if (showQuickActions) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showQuickActions, handleClickOutside]);

  return (
    <div className="relative">
      <Card
        ref={cardRef}
        className={cn(
          "transition-all duration-150 cursor-pointer select-none",
          pressScale && isPressed && "scale-95",
          showQuickActions && "ring-2 ring-primary/50 shadow-lg",
          className
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        {...props}
      >
        {children}
      </Card>

      {/* Quick Actions Menu */}
      {showQuickActions && quickActions.length > 0 && (
        <div className="absolute top-0 left-0 right-0 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-border p-2 mx-2 -mt-2">
            <div className="grid grid-cols-4 gap-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.action)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-lg transition-colors",
                    "hover:bg-muted active:bg-muted/80",
                    "touch-manipulation min-h-[60px]",
                    action.color || "text-foreground"
                  )}
                >
                  <div className="text-lg">
                    {action.icon}
                  </div>
                  <span className="text-xs font-medium text-center">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
            
            {/* Arrow pointing to card */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
              <div className="w-3 h-3 bg-white dark:bg-gray-900 border-r border-b border-border rotate-45"></div>
            </div>
          </div>
        </div>
      )}

      {/* Press feedback overlay */}
      {isPressed && (
        <div className="absolute inset-0 bg-primary/10 rounded-lg pointer-events-none animate-pulse" />
      )}
    </div>
  );
};