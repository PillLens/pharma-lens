import React, { useState, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  threshold?: number;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  className,
  threshold = 70
}) => {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!pulling || window.scrollY > 0) return;

    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, currentY.current - startY.current);
    
    if (distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, threshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (!pulling) return;

    setPulling(false);
    
    if (pullDistance >= threshold) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
    
    setPullDistance(0);
  };

  const rotation = Math.min((pullDistance / threshold) * 360, 360);
  const opacity = Math.min(pullDistance / threshold, 1);

  return (
    <div
      className={cn("relative", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to Refresh Indicator */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-200",
          "bg-gradient-to-b from-background/90 to-transparent backdrop-blur-sm"
        )}
        style={{
          height: `${Math.max(pullDistance, refreshing ? 60 : 0)}px`,
          opacity: refreshing ? 1 : opacity
        }}
      >
        <div className="flex items-center gap-2 text-primary">
          <RefreshCw 
            className={cn(
              "w-5 h-5 transition-transform duration-200",
              refreshing && "animate-spin"
            )}
            style={{
              transform: `rotate(${refreshing ? 0 : rotation}deg)`
            }}
          />
          <span className="text-sm font-medium">
            {refreshing 
              ? 'Refreshing...' 
              : pullDistance >= threshold 
                ? 'Release to refresh' 
                : 'Pull to refresh'
            }
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${refreshing ? 60 : pullDistance * 0.5}px)`,
          transition: pulling ? 'none' : 'transform 0.2s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;