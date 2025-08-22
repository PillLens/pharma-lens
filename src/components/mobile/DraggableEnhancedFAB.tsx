import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Mic, Heart, Plus, X, Scan, Zap } from 'lucide-react';
import { MobileButton } from '@/components/ui/mobile/MobileButton';
import { TranslatedText } from '@/components/TranslatedText';
import { cn } from '@/lib/utils';

interface DraggableEnhancedFABProps {
  onScanPress: () => void;
  onVoicePress: () => void;
  onEmergencyPress: () => void;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
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

const DraggableEnhancedFAB: React.FC<DraggableEnhancedFABProps> = ({
  onScanPress,
  onVoicePress,
  onEmergencyPress,
  isMenuOpen,
  onMenuToggle,
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
  const FAB_SIZE = 64; // 16 * 4 = 64px for xl size
  const SNAP_THRESHOLD = 40;
  const SAFE_MARGIN = 20;

  const fabActions = [
    {
      icon: Camera,
      label: 'Scan',
      onClick: onScanPress,
      variant: 'scan' as const,
      className: 'bg-primary hover:bg-primary-glow text-white shadow-medical'
    },
    {
      icon: Mic,
      label: 'Voice Search',
      onClick: onVoicePress,
      variant: 'secondary' as const,
      className: 'bg-info hover:bg-info/90 text-white shadow-medical'
    },
    {
      icon: Heart,
      label: 'Emergency',
      onClick: onEmergencyPress,
      variant: 'emergency' as const,
      className: 'bg-emergency hover:bg-emergency/90 text-white shadow-emergency animate-pulse'
    }
  ];

  // Get storage key for this route
  const getStorageKey = () => `enhanced-fab-position-${routeKey}`;

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
      // It was a regular click, not a drag - toggle menu
      onMenuToggle();
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
  }, [isDragging, isPressed, onMenuToggle, position, findNearestSnapZone, constrainPosition, savePosition]);

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
    e.stopPropagation();
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
    e.stopPropagation();
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

  // Close menu when dragging starts
  useEffect(() => {
    if (isDragging && isMenuOpen) {
      onMenuToggle();
    }
  }, [isDragging, isMenuOpen, onMenuToggle]);

  return (
    <>
      {/* Backdrop */}
      {isMenuOpen && !isDragging && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onMenuToggle}
        />
      )}

      {/* FAB Menu Actions - positioned relative to FAB */}
      {isMenuOpen && !isDragging && (
        <div className="fixed z-50">
          <div 
            className="flex flex-col-reverse gap-3"
            style={{
              left: `${position.x}px`,
              top: `${position.y - 200}px`, // Position above the FAB
            }}
          >
            {fabActions.map((action, index) => (
              <div
                key={action.label}
                className={`transform transition-all duration-300 ${
                  isMenuOpen 
                    ? 'translate-y-0 opacity-100 scale-100' 
                    : 'translate-y-4 opacity-0 scale-95'
                }`}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-card">
                    <span className="text-sm font-medium text-foreground whitespace-nowrap">
                      <TranslatedText 
                        translationKey={`fab.${action.label.toLowerCase().replace(/\s+/g, '')}`} 
                        fallback={action.label} 
                      />
                    </span>
                  </div>
                  <MobileButton
                    size="lg"
                    variant={action.variant}
                    onClick={() => {
                      action.onClick();
                      onMenuToggle();
                    }}
                    className={`w-14 h-14 rounded-full shadow-floating hover:scale-110 transition-all duration-200 ${action.className}`}
                    haptic
                  >
                    <action.icon className="w-6 h-6" />
                  </MobileButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main FAB Toggle - Draggable */}
      <MobileButton
        ref={fabRef}
        size="xl"
        className={cn(
          'fixed w-16 h-16 rounded-full shadow-floating transition-all duration-300 select-none z-50',
          isDragging && 'scale-110 shadow-2xl cursor-grabbing',
          isPressed && !isDragging && 'scale-95',
          !isDragging && 'hover:scale-110 cursor-grab',
          isMenuOpen 
            ? 'bg-destructive hover:bg-destructive/90 text-white rotate-45' 
            : 'bg-primary hover:bg-primary-glow text-white rotate-0'
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
        {isMenuOpen ? (
          <X className="w-7 h-7" />
        ) : (
          <div className="relative">
            <Plus className="w-7 h-7" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-warning rounded-full animate-ping" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-warning rounded-full" />
          </div>
        )}
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
                  'absolute w-16 h-16 rounded-full border-2 border-dashed transition-all duration-200',
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

export default DraggableEnhancedFAB;