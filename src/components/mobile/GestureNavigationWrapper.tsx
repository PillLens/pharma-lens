import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hapticService } from '@/services/hapticService';

interface GestureNavigationWrapperProps {
  children: React.ReactNode;
  enableSwipeBack?: boolean;
  onSwipeBack?: () => void;
  swipeBackThreshold?: number;
  className?: string;
}

export const GestureNavigationWrapper: React.FC<GestureNavigationWrapperProps> = ({
  children,
  enableSwipeBack = true,
  onSwipeBack,
  swipeBackThreshold = 100,
  className = ''
}) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enableSwipeBack) return;

    let isTracking = false;
    let startTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch.clientX < 20) { // Only trigger from edge
        isTracking = true;
        startTime = Date.now();
        setStartX(touch.clientX);
        setStartY(touch.clientY);
        setIsDragging(false);
        setDragX(0);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTracking) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;

      // Check if it's a horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 10) {
        if (!isDragging) {
          setIsDragging(true);
          hapticService.feedback('light');
        }
        
        setDragX(Math.min(deltaX, 200)); // Cap the drag distance
        e.preventDefault();
      } else if (Math.abs(deltaY) > 10) {
        // If user starts scrolling vertically, cancel the gesture
        isTracking = false;
        setIsDragging(false);
        setDragX(0);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isTracking || !isDragging) {
        isTracking = false;
        setIsDragging(false);
        setDragX(0);
        return;
      }

      const duration = Date.now() - startTime;
      const velocity = dragX / duration;

      // Trigger navigation if threshold is met or velocity is high
      if (dragX > swipeBackThreshold || velocity > 0.3) {
        hapticService.navigationBack();
        
        if (onSwipeBack) {
          onSwipeBack();
        } else {
          navigate(-1);
        }
      } else {
        // Snap back animation
        hapticService.feedback('light');
      }

      isTracking = false;
      setIsDragging(false);
      setDragX(0);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enableSwipeBack, navigate, onSwipeBack, swipeBackThreshold, startX, startY, dragX, isDragging]);

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        transform: isDragging ? `translateX(${dragX * 0.3}px)` : 'translateX(0)',
        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0, 0, 1)',
      }}
    >
      {/* Swipe Back Indicator */}
      {isDragging && (
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 z-50 pointer-events-none"
          style={{
            opacity: Math.min(dragX / swipeBackThreshold, 1),
            transform: `translateX(${Math.max(dragX - 50, 0)}px)`
          }}
        >
          <div className="bg-primary/20 backdrop-blur-sm rounded-full p-2 border border-primary/30">
            <div className="w-6 h-6 border-2 border-primary border-r-transparent rounded-full animate-spin" 
                 style={{ 
                   animationDuration: '1s',
                   transform: 'rotate(-90deg)'
                 }} 
            />
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
};