import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface PinchZoomTextProps {
  children: React.ReactNode;
  minScale?: number;
  maxScale?: number;
  className?: string;
  resetOnDoubleClick?: boolean;
}

export const PinchZoomText: React.FC<PinchZoomTextProps> = ({
  children,
  minScale = 1,
  maxScale = 3,
  className = '',
  resetOnDoubleClick = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Touch state
  const touchState = useRef({
    lastTouchDistance: 0,
    lastCenterX: 0,
    lastCenterY: 0,
    lastTouchTime: 0,
    touchCount: 0
  });

  const getTouchDistance = (touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touch1: Touch, touch2: Touch) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  };

  const constrainTranslation = (newScale: number, newTranslateX: number, newTranslateY: number) => {
    if (!containerRef.current) return { x: newTranslateX, y: newTranslateY };

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Calculate the scaled dimensions
    const scaledWidth = rect.width * newScale;
    const scaledHeight = rect.height * newScale;
    
    // Calculate maximum translation limits
    const maxTranslateX = Math.max(0, (scaledWidth - rect.width) / 2);
    const maxTranslateY = Math.max(0, (scaledHeight - rect.height) / 2);
    
    return {
      x: Math.max(-maxTranslateX, Math.min(maxTranslateX, newTranslateX)),
      y: Math.max(-maxTranslateY, Math.min(maxTranslateY, newTranslateY))
    };
  };

  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    
    const { touches } = e;
    touchState.current.touchCount = touches.length;
    touchState.current.lastTouchTime = Date.now();

    if (touches.length === 2) {
      const distance = getTouchDistance(touches[0], touches[1]);
      const center = getTouchCenter(touches[0], touches[1]);
      
      touchState.current.lastTouchDistance = distance;
      touchState.current.lastCenterX = center.x;
      touchState.current.lastCenterY = center.y;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    
    const { touches } = e;
    
    if (touches.length === 2 && scale >= minScale) {
      const distance = getTouchDistance(touches[0], touches[1]);
      const center = getTouchCenter(touches[0], touches[1]);
      
      if (touchState.current.lastTouchDistance > 0) {
        // Calculate scale change
        const scaleChange = distance / touchState.current.lastTouchDistance;
        const newScale = Math.max(minScale, Math.min(maxScale, scale * scaleChange));
        
        // Calculate translation to keep zoom centered
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const centerOffsetX = center.x - rect.left - rect.width / 2;
          const centerOffsetY = center.y - rect.top - rect.height / 2;
          
          const scaleRatio = newScale / scale;
          const newTranslateX = translateX * scaleRatio + centerOffsetX * (1 - scaleRatio);
          const newTranslateY = translateY * scaleRatio + centerOffsetY * (1 - scaleRatio);
          
          const constrained = constrainTranslation(newScale, newTranslateX, newTranslateY);
          
          setScale(newScale);
          setTranslateX(constrained.x);
          setTranslateY(constrained.y);
        }
      }
      
      touchState.current.lastTouchDistance = distance;
      touchState.current.lastCenterX = center.x;
      touchState.current.lastCenterY = center.y;
    } else if (touches.length === 1 && scale > minScale) {
      // Single finger panning when zoomed
      const touch = touches[0];
      const rect = containerRef.current?.getBoundingClientRect();
      
      if (rect && touchState.current.lastCenterX && touchState.current.lastCenterY) {
        const deltaX = touch.clientX - touchState.current.lastCenterX;
        const deltaY = touch.clientY - touchState.current.lastCenterY;
        
        const newTranslateX = translateX + deltaX;
        const newTranslateY = translateY + deltaY;
        
        const constrained = constrainTranslation(scale, newTranslateX, newTranslateY);
        
        setTranslateX(constrained.x);
        setTranslateY(constrained.y);
      }
      
      touchState.current.lastCenterX = touch.clientX;
      touchState.current.lastCenterY = touch.clientY;
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchState.current.lastTouchTime;
    
    // Reset touch state
    touchState.current.lastTouchDistance = 0;
    touchState.current.touchCount = e.touches.length;
    
    // Handle double tap to reset
    if (resetOnDoubleClick && 
        touchDuration < 300 && 
        e.touches.length === 0 && 
        touchState.current.touchCount === 1) {
      
      const timeSinceLastTouch = touchEndTime - (touchState.current.lastTouchTime || 0);
      
      if (timeSinceLastTouch < 300) {
        resetZoom();
      }
    }
  };

  const resetZoom = () => {
    setIsTransitioning(true);
    setScale(minScale);
    setTranslateX(0);
    setTranslateY(0);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Add touch event listeners with passive: false to prevent default scrolling
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [scale, translateX, translateY, minScale, maxScale]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden touch-none select-none",
        className
      )}
      style={{
        touchAction: 'none'
      }}
    >
      <div
        className={cn(
          "origin-center",
          isTransitioning && "transition-transform duration-300 ease-out"
        )}
        style={{
          transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
          transition: isTransitioning ? 'transform 0.3s ease-out' : 'none'
        }}
      >
        {children}
      </div>
      
      {/* Zoom indicator */}
      {scale > minScale && (
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
          {Math.round(scale * 100)}%
        </div>
      )}
      
      {/* Reset button when zoomed */}
      {scale > minScale && resetOnDoubleClick && (
        <button
          onClick={resetZoom}
          className="absolute bottom-2 right-2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full shadow-lg active:scale-95 transition-transform"
        >
          Reset
        </button>
      )}
    </div>
  );
};
