import React from 'react';
import { Loader2, Scan, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
  variant?: 'card' | 'list' | 'text' | 'avatar' | 'scan';
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = '',
  count = 1,
  variant = 'card'
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <Card className={`medical-surface ${className}`}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'list':
        return (
          <div className={`animate-pulse space-y-3 p-4 ${className}`}>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-1">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className={`animate-pulse space-y-2 ${className}`}>
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-4/5"></div>
            <div className="h-4 bg-muted rounded w-3/5"></div>
          </div>
        );

      case 'avatar':
        return (
          <div className={`animate-pulse flex items-center gap-3 ${className}`}>
            <div className="h-12 w-12 bg-muted rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-3 bg-muted rounded w-16"></div>
            </div>
          </div>
        );

      case 'scan':
        return (
          <div className={`text-center p-8 ${className}`}>
            <div className="animate-pulse space-y-4">
              <div className="h-32 w-32 bg-muted rounded-lg mx-auto"></div>
              <div className="h-4 bg-muted rounded w-48 mx-auto"></div>
              <div className="h-3 bg-muted rounded w-32 mx-auto"></div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
};

interface ScanProgressProps {
  stage: 'detecting' | 'processing' | 'analyzing' | 'complete' | 'error';
  progress?: number;
  message?: string;
  className?: string;
}

export const ScanProgress: React.FC<ScanProgressProps> = ({
  stage,
  progress = 0,
  message,
  className = ''
}) => {
  const getStageConfig = () => {
    switch (stage) {
      case 'detecting':
        return {
          icon: <Scan className="h-8 w-8 text-primary animate-pulse" />,
          title: 'Detecting Medication',
          color: 'text-primary',
          bgColor: 'bg-primary/10'
        };
      case 'processing':
        return {
          icon: <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />,
          title: 'Processing Image',
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10'
        };
      case 'analyzing':
        return {
          icon: <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />,
          title: 'Analyzing Results',
          color: 'text-orange-500',
          bgColor: 'bg-orange-500/10'
        };
      case 'complete':
        return {
          icon: <CheckCircle className="h-8 w-8 text-green-500" />,
          title: 'Scan Complete',
          color: 'text-green-500',
          bgColor: 'bg-green-500/10'
        };
      case 'error':
        return {
          icon: <XCircle className="h-8 w-8 text-red-500" />,
          title: 'Scan Failed',
          color: 'text-red-500',
          bgColor: 'bg-red-500/10'
        };
    }
  };

  const config = getStageConfig();

  return (
    <div className={`text-center p-6 ${className}`}>
      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${config.bgColor} mb-4`}>
        {config.icon}
      </div>
      
      <h3 className={`text-lg font-semibold ${config.color} mb-2`}>
        {config.title}
      </h3>
      
      {message && (
        <p className="text-sm text-muted-foreground mb-4">
          {message}
        </p>
      )}
      
      {stage !== 'complete' && stage !== 'error' && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {Math.round(progress)}% complete
          </p>
        </div>
      )}
    </div>
  );
};

interface SuccessAnimationProps {
  show: boolean;
  title?: string;
  message?: string;
  onComplete?: () => void;
  duration?: number;
  className?: string;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  show,
  title = 'Success!',
  message,
  onComplete,
  duration = 2000,
  className = ''
}) => {
  React.useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, duration);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete, duration]);

  if (!show) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm ${className}`}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-sm mx-4 text-center" style={{
        animation: 'scale-in 0.3s ease-out'
      }}>
        <div className="relative mb-6">
          {/* Success Circle Animation */}
          <div className="w-20 h-20 mx-auto relative">
            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
            <div className="relative w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-white" style={{
            animation: 'bounce-in 0.6s 0.2s ease-out forwards',
            transform: 'scale(0)'
          }} />
            </div>
          </div>
          
          {/* Checkmark Animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{
                strokeDasharray: '20',
                strokeDashoffset: '20',
                animation: 'checkmark 0.6s 0.3s ease-in-out forwards'
              }}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={3} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-foreground mb-2" style={{
          animation: 'fade-in-up 0.4s ease-out'
        }}>
          {title}
        </h3>
        
        {message && (
          <p className="text-muted-foreground" style={{
            animation: 'fade-in-up 0.4s 0.2s ease-out forwards',
            opacity: 0
          }}>
            {message}
          </p>
        )}
      </div>
      
      <style>{`
        @keyframes checkmark {
          to {
            stroke-dashoffset: 0;
          }
        }
        
        @keyframes bounce-in {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
        
        @keyframes scale-in {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes fade-in-up {
          0% {
            transform: translateY(20px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

interface ProcessingOverlayProps {
  show: boolean;
  title?: string;
  message?: string;
  progress?: number;
  stage?: 'detecting' | 'processing' | 'analyzing';
  onCancel?: () => void;
  className?: string;
}

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({
  show,
  title = 'Processing...',
  message,
  progress,
  stage = 'processing',
  onCancel,
  className = ''
}) => {
  if (!show) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm ${className}`}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-sm mx-4 text-center">
        <ScanProgress 
          stage={stage}
          progress={progress}
          message={message}
        />
        
        <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">
          {title}
        </h3>
        
        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-4 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};