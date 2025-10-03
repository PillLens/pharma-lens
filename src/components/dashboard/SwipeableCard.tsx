import React, { useState, useRef, TouchEvent } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  swipeRightLabel?: string;
  swipeLeftLabel?: string;
  swipeRightIcon?: React.ReactNode;
  swipeLeftIcon?: React.ReactNode;
  threshold?: number;
  className?: string;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeRight,
  onSwipeLeft,
  swipeRightLabel = 'Mark as Taken',
  swipeLeftLabel = 'Skip',
  swipeRightIcon = <CheckCircle className="w-5 h-5" />,
  swipeLeftIcon = <XCircle className="w-5 h-5" />,
  threshold = 100,
  className
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = (e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isSwiping) return;
    
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    
    // Limit swipe to +/- 150px for better UX
    const limitedDiff = Math.max(-150, Math.min(150, diff));
    setTranslateX(limitedDiff);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    
    // Trigger action if threshold is met
    if (translateX > threshold && onSwipeRight) {
      onSwipeRight();
    } else if (translateX < -threshold && onSwipeLeft) {
      onSwipeLeft();
    }
    
    // Reset position
    setTranslateX(0);
  };

  const swipeProgress = Math.abs(translateX) / threshold;
  const isSwipingRight = translateX > 0;
  const isSwipingLeft = translateX < 0;

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Background actions */}
      <div className="absolute inset-0 flex items-center justify-between px-6">
        {/* Right swipe action (Mark as Taken) */}
        <div 
          className={cn(
            'flex items-center gap-2 text-white font-medium transition-opacity',
            isSwipingRight ? 'opacity-100' : 'opacity-0'
          )}
          style={{ opacity: isSwipingRight ? swipeProgress : 0 }}
        >
          {swipeRightIcon}
          <span>{swipeRightLabel}</span>
        </div>

        {/* Left swipe action (Skip) */}
        <div 
          className={cn(
            'flex items-center gap-2 text-white font-medium transition-opacity ml-auto',
            isSwipingLeft ? 'opacity-100' : 'opacity-0'
          )}
          style={{ opacity: isSwipingLeft ? swipeProgress : 0 }}
        >
          <span>{swipeLeftLabel}</span>
          {swipeLeftIcon}
        </div>
      </div>

      {/* Background color indicators */}
      <div 
        className={cn(
          'absolute inset-0 transition-opacity',
          isSwipingRight && 'bg-success',
          isSwipingLeft && 'bg-destructive'
        )}
        style={{ 
          opacity: swipeProgress * 0.9,
          transform: `scaleX(${swipeProgress})`
        }}
      />

      {/* Card content */}
      <div
        className={cn(
          'relative bg-card transition-transform',
          isSwiping ? 'duration-0' : 'duration-300'
        )}
        style={{ 
          transform: `translateX(${translateX}px)`,
          touchAction: 'pan-y' // Allow vertical scrolling
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="button"
        tabIndex={0}
        aria-label="Swipe right to mark as taken, left to skip"
      >
        {children}
      </div>
    </div>
  );
};
