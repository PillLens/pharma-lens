import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MobileButton } from '@/components/ui/mobile/MobileButton';
import { cn } from '@/lib/utils';

interface DraggableFABProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  routeKey: string; // For route-specific positioning
}

interface Position {
  x: number;
  y: number;
}

interface SnapZone {
  x: number;
  y: number;
  label: string;
}

const DraggableFAB: React.FC<DraggableFABProps> = ({
  children,
  onClick,
  className = '',
  routeKey
}) => {
  const fabRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState<Position>({ x: 0, y: 0 });
  const [isPressed, setIsPressed] = useState(false);
  const pressTimerRef = useRef<NodeJS.Timeout>();

  const PRESS_DURATION = 500; // 500ms press to start dragging
  const FAB_SIZE = 56; // 14 * 4 = 56px
  const SNAP_THRESHOLD = 40;
  const SAFE_MARGIN = 20;

  // Get storage key for this route
  const getStorageKey = () => `fab-position-${routeKey}`;

  // Define snap zones based on screen size
  const getSnapZones = useCallback((): SnapZone[] => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Account for mobile navigation (bottom) and header areas
    const topSafeArea = 80; // Header area
    const bottomSafeArea = 100; // Bottom navigation area
    const sideSafeArea = SAFE_MARGIN;

    return [
      // Top corners
      { x: sideSafeArea, y: topSafeArea, label: 'top-left' },
      { x: viewportWidth - FAB_SIZE - sideSafeArea, y: topSafeArea, label: 'top-right' },
      
      // Middle edges
      { x: sideSafeArea, y: viewportHeight / 2 - FAB_SIZE / 2, label: 'middle-left' },
      { x: viewportWidth - FAB_SIZE - sideSafeArea, y: viewportHeight / 2 - FAB_SIZE / 2, label: 'middle-right' },
      
      // Bottom corners (avoiding navigation)
      { x: sideSafeArea, y: viewportHeight - bottomSafeArea - FAB_SIZE, label: 'bottom-left' },
      { x: viewportWidth - FAB_SIZE - sideSafeArea, y: viewportHeight - bottomSafeArea - FAB_SIZE, label: 'bottom-right' },
    ];
  }, []);

  // Find nearest snap zone
  const findNearestSnapZone = useCallback((pos: Position): Position => {
    const snapZones = getSnapZones();
    let nearestZone = snapZones[0];
    let minDistance = Infinity;

    snapZones.forEach(zone => {
      const distance = Math.sqrt(
        Math.pow(pos.x - zone.x, 2) + Math.pow(pos.y - zone.y, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestZone = zone;
      }
    });

    // Only snap if within threshold
    if (minDistance <= SNAP_THRESHOLD) {
      return { x: nearestZone.x, y: nearestZone.y };
    }

    return pos;
  }, [getSnapZones]);

  // Constrain position to safe areas
  const constrainPosition = useCallback((pos: Position): Position => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const topSafeArea = 80;
    const bottomSafeArea = 100;
    const sideSafeArea = SAFE_MARGIN;

    return {
      x: Math.max(sideSafeArea, Math.min(pos.x, viewportWidth - FAB_SIZE - sideSafeArea)),
      y: Math.max(topSafeArea, Math.min(pos.y, viewportHeight - bottomSafeArea - FAB_SIZE))
    };
  }, []);

  // Load saved position or set default
  useEffect(() => {
    const savedPosition = localStorage.getItem(getStorageKey());
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);
        const constrainedPos = constrainPosition(parsed);
        setPosition(constrainedPos);
      } catch {
        // If parsing fails, use default position
        setDefaultPosition();
      }
    } else {
      setDefaultPosition();
    }
  }, [routeKey, constrainPosition]);

  const setDefaultPosition = () => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const defaultPos = {
      x: viewportWidth - FAB_SIZE - SAFE_MARGIN,
      y: viewportHeight - 120 - FAB_SIZE // Above bottom nav
    };
    setPosition(constrainPosition(defaultPos));
  };

  // Save position to localStorage
  const savePosition = useCallback((pos: Position) => {
    localStorage.setItem(getStorageKey(), JSON.stringify(pos));
  }, [getStorageKey]);

  // Handle press start (mouse/touch)
  const handlePressStart = useCallback((clientX: number, clientY: number) => {
    setIsPressed(true);
    setDragStart({ x: clientX, y: clientY });
    setInitialPosition(position);

    // Start press timer
    pressTimerRef.current = setTimeout(() => {
      setIsDragging(true);
      // Add haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, PRESS_DURATION);
  }, [position]);

  // Handle press end
  const handlePressEnd = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }

    if (!isDragging && isPressed) {
      // It was a regular click, not a drag
      onClick();
    }

    if (isDragging) {
      // Snap to nearest zone and save position
      const snappedPosition = findNearestSnapZone(position);
      const finalPosition = constrainPosition(snappedPosition);
      setPosition(finalPosition);
      savePosition(finalPosition);
    }

    setIsDragging(false);
    setIsPressed(false);
  }, [isDragging, isPressed, onClick, position, findNearestSnapZone, constrainPosition, savePosition]);

  // Handle drag move
  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;

    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    
    const newPosition = constrainPosition({
      x: initialPosition.x + deltaX,
      y: initialPosition.y + deltaY
    });

    setPosition(newPosition);
  }, [isDragging, dragStart, initialPosition, constrainPosition]);

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handlePressStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    handleDragMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handlePressEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handlePressStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleDragMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    handlePressEnd();
  };

  // Add global event listeners when dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd, { passive: false });
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const constrainedPos = constrainPosition(position);
      if (constrainedPos.x !== position.x || constrainedPos.y !== position.y) {
        setPosition(constrainedPos);
        savePosition(constrainedPos);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position, constrainPosition, savePosition]);

  return (
    <>
      <MobileButton
        ref={fabRef}
        className={cn(
          'fixed w-14 h-14 rounded-full shadow-2xl bg-gradient-to-br from-primary to-primary/80 border-0 z-50 transition-all duration-300 select-none',
          isDragging && 'scale-110 shadow-3xl cursor-grabbing',
          isPressed && !isDragging && 'scale-95',
          !isDragging && 'hover:scale-110 cursor-grab',
          className
        )}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          touchAction: 'none',
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        haptic={false} // Disable default haptic since we handle it manually
      >
        {children}
      </MobileButton>
      
      {/* Visual feedback during drag */}
      {isDragging && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          {getSnapZones().map((zone, index) => {
            const distance = Math.sqrt(
              Math.pow(position.x - zone.x, 2) + Math.pow(position.y - zone.y, 2)
            );
            const isNear = distance <= SNAP_THRESHOLD;
            
            return (
              <div
                key={index}
                className={cn(
                  'absolute w-14 h-14 rounded-full border-2 border-dashed transition-all duration-200',
                  isNear ? 'border-primary bg-primary/20 scale-110' : 'border-muted-foreground/30'
                )}
                style={{
                  left: `${zone.x}px`,
                  top: `${zone.y}px`,
                }}
              />
            );
          })}
        </div>
      )}
    </>
  );
};

export default DraggableFAB;