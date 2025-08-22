import React from 'react';
import { Loader2, Activity, Stethoscope } from 'lucide-react';
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle } from './MobileCard';
import { cn } from '@/lib/utils';

interface MobileLoadingStateProps {
  message?: string;
  subMessage?: string;
  type?: 'default' | 'medical' | 'scanning';
  className?: string;
}

export const MobileLoadingState: React.FC<MobileLoadingStateProps> = ({
  message = 'Loading...',
  subMessage,
  type = 'default',
  className
}) => {
  const getIcon = () => {
    switch (type) {
      case 'medical':
        return <Stethoscope className="w-8 h-8 text-primary animate-medical-pulse" />;
      case 'scanning':
        return <Activity className="w-8 h-8 text-primary animate-scan-line" />;
      default:
        return <Loader2 className="w-8 h-8 text-primary animate-spin" />;
    }
  };

  return (
    <div className={cn("flex items-center justify-center p-8", className)}>
      <MobileCard variant="medical" className="text-center max-w-sm w-full">
        <MobileCardHeader>
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <MobileCardTitle className="text-base">
            {message}
          </MobileCardTitle>
        </MobileCardHeader>
        {subMessage && (
          <MobileCardContent>
            <p className="text-sm text-muted-foreground">{subMessage}</p>
          </MobileCardContent>
        )}
      </MobileCard>
    </div>
  );
};

interface MobileSkeletonProps {
  lines?: number;
  showAvatar?: boolean;
  className?: string;
}

export const MobileSkeleton: React.FC<MobileSkeletonProps> = ({
  lines = 3,
  showAvatar = false,
  className
}) => {
  return (
    <MobileCard variant="medical" className={cn("animate-fade-in", className)}>
      <MobileCardContent className="p-4">
        <div className="flex items-start gap-3">
          {showAvatar && (
            <div className="w-12 h-12 bg-muted rounded-full animate-pulse" />
          )}
          <div className="flex-1 space-y-3">
            {Array.from({ length: lines }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-4 bg-muted rounded animate-pulse",
                  i === 0 && "w-3/4",
                  i === 1 && "w-full",
                  i === 2 && "w-2/3",
                  i > 2 && "w-5/6"
                )}
              />
            ))}
          </div>
        </div>
      </MobileCardContent>
    </MobileCard>
  );
};

export const MobileLoadingGrid: React.FC<{ items?: number }> = ({ items = 6 }) => {
  return (
    <div className="grid gap-4 p-4">
      {Array.from({ length: items }).map((_, i) => (
        <MobileSkeleton key={i} lines={2} showAvatar />
      ))}
    </div>
  );
};