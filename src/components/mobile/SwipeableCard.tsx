import React, { useState, useRef, useEffect } from 'react';
import { Bookmark, Trash2, Check, X, Archive } from 'lucide-react';
import { MobileCard } from '@/components/ui/mobile/MobileCard';
import { cn } from '@/lib/utils';

interface SwipeAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  action: () => void;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  className?: string;
  onDelete?: () => void;
  onBookmark?: () => void;
  onArchive?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'critical' | 'unknown';
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  className,
  onDelete,
  onBookmark,
  onArchive,
  disabled = false,
  variant = 'default'
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showActions, setShowActions] = useState<'left' | 'right' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 80;
  const ACTION_THRESHOLD = 120;

  const leftActions: SwipeAction[] = [
    {
      id: 'bookmark',
      label: 'Save',
      icon: Bookmark,
      color: 'text-info',
      bgColor: 'bg-info',
      action: onBookmark || (() => {})
    }
  ];

  const rightActions: SwipeAction[] = [
    ...(onArchive ? [{
      id: 'archive',
      label: 'Archive',
      icon: Archive,
      color: 'text-warning',
      bgColor: 'bg-warning',
      action: onArchive
    }] : []),
    ...(onDelete ? [{
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      color: 'text-destructive',
      bgColor: 'bg-destructive',
      action: onDelete
    }] : [])
  ];

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || disabled) return;
    
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - startX;
    
    // Limit swipe distance
    const maxSwipe = 160;
    const limitedDelta = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));
    
    setTranslateX(limitedDelta);
    
    // Show action hints
    if (limitedDelta > SWIPE_THRESHOLD) {
      setShowActions('left');
    } else if (limitedDelta < -SWIPE_THRESHOLD) {
      setShowActions('right');
    } else {
      setShowActions(null);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || disabled) return;
    
    setIsDragging(false);
    
    // Execute action if threshold met
    if (translateX > ACTION_THRESHOLD && leftActions.length > 0) {
      leftActions[0].action();
    } else if (translateX < -ACTION_THRESHOLD && rightActions.length > 0) {
      rightActions[rightActions.length - 1].action();
    }
    
    // Reset position
    setTranslateX(0);
    setShowActions(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setStartX(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || disabled) return;
    
    const deltaX = e.clientX - startX;
    const maxSwipe = 160;
    const limitedDelta = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));
    
    setTranslateX(limitedDelta);
    
    if (limitedDelta > SWIPE_THRESHOLD) {
      setShowActions('left');
    } else if (limitedDelta < -SWIPE_THRESHOLD) {
      setShowActions('right');
    } else {
      setShowActions(null);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging || disabled) return;
    
    setIsDragging(false);
    
    if (translateX > ACTION_THRESHOLD && leftActions.length > 0) {
      leftActions[0].action();
    } else if (translateX < -ACTION_THRESHOLD && rightActions.length > 0) {
      rightActions[rightActions.length - 1].action();
    }
    
    setTranslateX(0);
    setShowActions(null);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setTranslateX(0);
        setShowActions(null);
      }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || disabled) return;
      
      const deltaX = e.clientX - startX;
      const maxSwipe = 160;
      const limitedDelta = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));
      
      setTranslateX(limitedDelta);
      
      if (limitedDelta > SWIPE_THRESHOLD) {
        setShowActions('left');
      } else if (limitedDelta < -SWIPE_THRESHOLD) {
        setShowActions('right');
      } else {
        setShowActions(null);
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('mousemove', handleGlobalMouseMove);

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDragging, startX, disabled]);

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-success/30 bg-gradient-to-r from-success/5 to-success/10';
      case 'warning':
        return 'border-warning/30 bg-gradient-to-r from-warning/5 to-warning/10';
      case 'critical':
        return 'border-destructive/30 bg-gradient-to-r from-destructive/5 to-destructive/10 animate-pulse';
      case 'unknown':
        return 'border-warning/40 bg-gradient-to-r from-warning/10 to-warning/5';
      default:
        return 'border-border';
    }
  };

  return (
    <div className="relative overflow-hidden" ref={cardRef}>
      {/* Left Actions */}
      {leftActions.length > 0 && (
        <div className="absolute left-0 top-0 h-full flex items-center">
          {leftActions.map((action, index) => (
            <div
              key={action.id}
              className={cn(
                `w-20 h-full flex flex-col items-center justify-center ${action.bgColor} text-white transition-all duration-200`,
                showActions === 'left' ? 'opacity-100 scale-100' : 'opacity-70 scale-95'
              )}
            >
              <action.icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{action.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Right Actions */}
      {rightActions.length > 0 && (
        <div className="absolute right-0 top-0 h-full flex items-center">
          {rightActions.map((action, index) => (
            <div
              key={action.id}
              className={cn(
                `w-20 h-full flex flex-col items-center justify-center ${action.bgColor} text-white transition-all duration-200`,
                showActions === 'right' ? 'opacity-100 scale-100' : 'opacity-70 scale-95'
              )}
            >
              <action.icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{action.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Card */}
      <div
        className={cn(
          'relative transition-transform duration-200 ease-out select-none',
          isDragging ? 'transition-none' : '',
          disabled ? 'cursor-default' : 'cursor-grab',
          isDragging ? 'cursor-grabbing' : ''
        )}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <MobileCard 
          className={cn(
            'transition-all duration-200',
            getVariantStyles(),
            isDragging ? 'shadow-floating scale-[1.02]' : 'shadow-card',
            className
          )}
        >
          {children}
        </MobileCard>
      </div>

      {/* Action Indicators */}
      {showActions && (
        <div className="absolute top-2 right-2 z-10">
          <div className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold',
            showActions === 'left' ? 'bg-info' : 'bg-destructive'
          )}>
            {showActions === 'left' ? <Bookmark className="w-3 h-3" /> : <Trash2 className="w-3 h-3" />}
          </div>
        </div>
      )}
    </div>
  );
};

export default SwipeableCard;