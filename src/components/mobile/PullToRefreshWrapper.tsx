import React, { useState, useRef, useEffect } from 'react';
import { RotateCcw, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshWrapperProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  threshold?: number;
  disabled?: boolean;
}

const PullToRefreshWrapper: React.FC<PullToRefreshWrapperProps> = ({
  children,
  onRefresh,
  className,
  threshold = 80,
  disabled = false
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const maxPullDistance = threshold * 1.5;
  const triggerThreshold = threshold;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    setStartY(e.touches[0].clientY);
    setIsPulling(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY;
    
    if (deltaY > 0) {
      // Prevent default scroll behavior when pulling down
      e.preventDefault();
      
      // Apply resistance curve - slower pull as distance increases
      const resistance = Math.max(0.3, 1 - (deltaY / (maxPullDistance * 2)));
      const adjustedDistance = Math.min(maxPullDistance, deltaY * resistance);
      
      setPullDistance(adjustedDistance);
      
      // Add haptic feedback at trigger point
      if (adjustedDistance >= triggerThreshold && pullDistance < triggerThreshold) {
        // Trigger haptic feedback here (if available)
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling || disabled) return;
    
    setIsPulling(false);
    
    if (pullDistance >= triggerThreshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
        // Success haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate([50, 50, 50]);
        }
      } catch (error) {
        console.error('Refresh failed:', error);
        // Error haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
  };

  const getRefreshStatus = () => {
    if (isRefreshing) return 'refreshing';
    if (pullDistance >= triggerThreshold) return 'release';
    if (pullDistance > 0) return 'pull';
    return 'idle';
  };

  const getRefreshIcon = () => {
    const status = getRefreshStatus();
    const rotation = Math.min(180, (pullDistance / triggerThreshold) * 180);
    
    switch (status) {
      case 'refreshing':
        return <RotateCcw className="w-5 h-5 text-primary animate-spin" />;
      case 'release':
        return <ChevronDown className="w-5 h-5 text-success" style={{ transform: 'rotate(180deg)' }} />;
      case 'pull':
        return <ChevronDown className="w-5 h-5 text-muted-foreground" style={{ transform: `rotate(${rotation}deg)` }} />;
      default:
        return <ChevronDown className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getRefreshText = () => {
    const status = getRefreshStatus();
    
    switch (status) {
      case 'refreshing':
        return 'Refreshing...';
      case 'release':
        return 'Release to refresh';
      case 'pull':
        return 'Pull to refresh';
      default:
        return '';
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-y-auto overscroll-contain scrollbar-hide', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to Refresh Indicator */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 z-10 flex flex-col items-center justify-center transition-all duration-300',
          'bg-gradient-to-b from-background/95 to-background/80 backdrop-blur-sm border-b border-border/50',
          pullDistance > 0 || isRefreshing ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          height: `${Math.max(0, pullDistance)}px`,
          transform: `translateY(${isRefreshing ? 0 : -20}px)`
        }}
      >
        {(pullDistance > 20 || isRefreshing) && (
          <>
            <div className="mb-2">
              {getRefreshIcon()}
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {getRefreshText()}
            </span>
          </>
        )}
      </div>

      {/* Content with pull transform */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: isPulling || isRefreshing ? `translateY(${pullDistance}px)` : 'translateY(0)'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefreshWrapper;