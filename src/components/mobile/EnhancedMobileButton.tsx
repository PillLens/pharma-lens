import React, { useRef, useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { hapticService } from '@/services/hapticService';
import { cn } from '@/lib/utils';

interface EnhancedMobileButtonProps extends ButtonProps {
  hapticPattern?: 'light' | 'medium' | 'heavy' | 'success' | 'error';
  enableLongPress?: boolean;
  longPressDelay?: number;
  onLongPress?: () => void;
  rippleEffect?: boolean;
  pressScale?: boolean;
}

export const EnhancedMobileButton: React.FC<EnhancedMobileButtonProps> = ({
  children,
  onClick,
  onLongPress,
  hapticPattern = 'light',
  enableLongPress = false,
  longPressDelay = 500,
  rippleEffect = true,
  pressScale = true,
  className,
  disabled,
  ...props
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const rippleCounter = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;

    setIsPressed(true);
    hapticService.feedback(hapticPattern);

    // Create ripple effect
    if (rippleEffect && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      const newRipple = {
        id: rippleCounter.current++,
        x,
        y
      };
      
      setRipples(prev => [...prev, newRipple]);
      
      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    }

    // Setup long press
    if (enableLongPress && onLongPress) {
      longPressTimer.current = setTimeout(() => {
        hapticService.longPress();
        onLongPress();
        setIsPressed(false);
      }, longPressDelay);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (disabled) return;

    setIsPressed(false);
    
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Regular click if not long press
    if (onClick && !enableLongPress) {
      onClick(e as any);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    
    // Desktop click handling with haptic feedback
    hapticService.buttonPress();
    
    if (onClick) {
      onClick(e);
    }
  };

  const handleMouseDown = () => {
    if (disabled) return;
    setIsPressed(true);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleMouseLeave = () => {
    setIsPressed(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <Button
      ref={buttonRef}
      className={cn(
        "relative overflow-hidden transition-all duration-150",
        pressScale && isPressed && "scale-95",
        "touch-manipulation", // Improves touch responsiveness
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      disabled={disabled}
      {...props}
    >
      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <span className="block w-0 h-0 bg-white/30 rounded-full" style={{
            animation: 'ripple 0.6s ease-out'
          }} />
        </span>
      ))}
      
      {children}
      
      <style>{`
        @keyframes ripple {
          to {
            width: 200px;
            height: 200px;
            opacity: 0;
          }
        }
      `}</style>
    </Button>
  );
};