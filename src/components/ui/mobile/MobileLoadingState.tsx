import React from 'react';
import { Loader2, Shield, Camera, Heart, Pill, Activity, Zap } from 'lucide-react';
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle } from './MobileCard';
import { cn } from '@/lib/utils';

interface MobileLoadingStateProps {
  message?: string;
  subMessage?: string;
  type?: 'default' | 'medical' | 'scanning' | 'medication' | 'emergency' | 'processing' | 'analyzing';
  className?: string;
  progress?: number; // 0-100 for progress indication
}

export const MobileLoadingState: React.FC<MobileLoadingStateProps> = ({
  message = 'Loading...',
  subMessage,
  type = 'default',
  className,
  progress
}) => {
  const getIcon = () => {
    switch (type) {
      case 'medical':
        return <Shield className="w-8 h-8 text-primary animate-medical-pulse" />;
      case 'scanning':
        return <Camera className="w-8 h-8 text-primary animate-bounce" />;
      case 'medication':
        return <Pill className="w-8 h-8 text-success animate-heartbeat" />;
      case 'emergency':
        return <Zap className="w-8 h-8 text-emergency animate-safety-blink" />;
      case 'processing':
        return <Activity className="w-8 h-8 text-info animate-medical-pulse" />;
      case 'analyzing':
        return <Heart className="w-8 h-8 text-primary animate-heartbeat" />;
      default:
        return <Loader2 className="w-8 h-8 text-primary animate-spin" />;
    }
  };

  const getCardVariant = () => {
    switch (type) {
      case 'emergency':
        return 'emergency';
      case 'medical':
        return 'medical';
      case 'medication':
        return 'success';
      case 'processing':
        return 'info';
      default:
        return 'medical';
    }
  };

  return (
    <div className={cn("flex items-center justify-center p-8", className)}>
      <MobileCard 
        variant={getCardVariant()} 
        className="text-center max-w-sm w-full"
      >
        <MobileCardHeader>
          <div className="flex justify-center mb-4 relative">
            {getIcon()}
            {type === 'scanning' && (
              <div className="absolute inset-0 border-2 border-primary/30 rounded-full animate-ping" />
            )}
            {type === 'emergency' && (
              <div className="absolute inset-0 border-2 border-emergency/40 rounded-full animate-ping" />
            )}
          </div>
          <MobileCardTitle className={cn(
            "text-base",
            type === 'emergency' && "text-emergency",
            type === 'medical' && "text-primary",
            type === 'medication' && "text-success"
          )}>
            {message}
          </MobileCardTitle>
        </MobileCardHeader>
        {(subMessage || progress !== undefined) && (
          <MobileCardContent>
            {progress !== undefined && (
              <div className="w-full mb-4">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-500 rounded-full animate-progress-glow",
                      type === 'emergency' ? 'bg-gradient-to-r from-emergency to-emergency-light' :
                      type === 'medical' ? 'bg-gradient-to-r from-primary to-primary-light' :
                      type === 'medication' ? 'bg-gradient-to-r from-success to-success-light' :
                      'bg-gradient-to-r from-primary to-primary-light'
                    )}
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">{Math.round(progress)}% complete</p>
              </div>
            )}
            {subMessage && (
              <p className="text-sm text-muted-foreground leading-relaxed">{subMessage}</p>
            )}
            {/* Trust indicators */}
            {type === 'medical' && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-3">
                <Shield className="w-3 h-3" />
                <span>Medical-grade security</span>
              </div>
            )}
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