import React, { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileButton } from './MobileButton';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  height?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  dismissible?: boolean;
  className?: string;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  height = 'lg',
  dismissible = true,
  className
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const heightClasses = {
    sm: 'h-1/3',
    md: 'h-1/2', 
    lg: 'h-2/3',
    xl: 'h-5/6',
    full: 'h-full'
  };

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleBackdropClick = () => {
    if (dismissible) {
      onClose();
    }
  };

  const handleDragStart = (e: React.TouchEvent) => {
    const startY = e.touches[0].clientY;
    const element = e.currentTarget as HTMLElement;
    const startTransform = element.style.transform;
    let isDragging = false;

    const handleDragMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;
      
      // Only start dragging if moving down significantly
      if (deltaY > 10) {
        isDragging = true;
        const translateY = Math.max(0, deltaY);
        element.style.transform = `translateY(${translateY}px)`;
      }
    };

    const handleDragEnd = (e: TouchEvent) => {
      const currentY = e.changedTouches[0].clientY;
      const deltaY = currentY - startY;
      
      if (isDragging && deltaY > 150 && dismissible) {
        onClose();
      } else {
        element.style.transform = startTransform;
      }

      document.removeEventListener('touchmove', handleDragMove);
      document.removeEventListener('touchend', handleDragEnd);
    };

    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300',
          isAnimating ? 'opacity-100' : 'opacity-0'
        )}
        onClick={handleBackdropClick}
      />

      {/* Bottom Sheet */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-xl shadow-floating border-t border-border transition-transform duration-300 ease-out',
          heightClasses[height],
          isAnimating ? 'translate-y-0' : 'translate-y-full',
          className
        )}
      >
        {/* Drag Handle */}
        <div 
          className="flex justify-center pt-3 pb-2"
          onTouchStart={handleDragStart}
        >
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header */}
        {(title || dismissible) && (
          <div className="flex-shrink-0 flex items-center justify-between px-4 pb-4 border-b border-border">
            <div className="flex-1">
              {title && (
                <h2 className="text-lg font-semibold text-foreground">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            {dismissible && (
              <MobileButton
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2"
              >
                <X className="w-5 h-5" />
              </MobileButton>
            )}
          </div>
        )}

        {/* Content */}
        <div 
          className="flex-1 overflow-y-auto scrollbar-hide" 
          style={{ 
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            scrollBehavior: 'smooth'
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
};

export default BottomSheet;