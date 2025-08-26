import React from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileNativeHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onClose?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'modal' | 'fullscreen';
}

const MobileNativeHeader: React.FC<MobileNativeHeaderProps> = ({
  title,
  subtitle,
  onBack,
  onClose,
  rightAction,
  className,
  variant = 'default'
}) => {
  return (
    <div className={cn(
      "flex items-center justify-between px-4 py-3",
      "bg-background/95 backdrop-blur-sm border-b border-border/50",
      "sticky top-0 z-50",
      variant === 'fullscreen' && "h-16",
      className
    )}>
      {/* Left Action */}
      <div className="flex items-center">
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-10 w-10 p-0 mr-2 hover:bg-accent/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        {onClose && !onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-10 w-10 p-0 mr-2 hover:bg-accent/50"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Title Section */}
      <div className="flex-1 text-center">
        <h1 className="text-lg font-semibold text-foreground truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground truncate">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right Action */}
      <div className="flex items-center">
        {rightAction || <div className="w-10 h-10" />}
      </div>
    </div>
  );
};

export default MobileNativeHeader;