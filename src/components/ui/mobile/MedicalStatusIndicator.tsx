import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Info, Zap, Heart, Shield } from 'lucide-react';

interface MedicalStatusIndicatorProps {
  status: 'safe' | 'caution' | 'warning' | 'critical' | 'emergency' | 'info';
  message: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  animated?: boolean;
  className?: string;
}

export const MedicalStatusIndicator: React.FC<MedicalStatusIndicatorProps> = ({
  status,
  message,
  severity,
  animated = false,
  className
}) => {
  const getIcon = () => {
    switch (status) {
      case 'safe':
        return <CheckCircle className="w-5 h-5" />;
      case 'caution':
        return <Info className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'critical':
        return <AlertTriangle className="w-5 h-5" />;
      case 'emergency':
        return <Zap className="w-5 h-5" />;
      case 'info':
        return <Shield className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getStatusStyles = () => {
    const baseStyles = "flex items-center gap-3 p-4 rounded-lg border-l-4 transition-all duration-300";
    
    switch (status) {
      case 'safe':
        return cn(
          baseStyles,
          "bg-gradient-to-r from-success/10 to-success/5 border-l-success text-success-foreground",
          animated && "animate-heartbeat"
        );
      case 'caution':
        return cn(
          baseStyles,
          "bg-gradient-to-r from-info/10 to-info/5 border-l-info text-info-foreground"
        );
      case 'warning':
        return cn(
          baseStyles,
          "bg-gradient-to-r from-warning/10 to-warning/5 border-l-warning text-warning-foreground",
          animated && "animate-safety-pulse"
        );
      case 'critical':
        return cn(
          baseStyles,
          "bg-gradient-to-r from-destructive/10 to-destructive/5 border-l-destructive text-destructive-foreground",
          animated && "animate-safety-pulse"
        );
      case 'emergency':
        return cn(
          baseStyles,
          "bg-gradient-to-r from-emergency/15 to-emergency/5 border-l-emergency text-emergency-foreground",
          animated && "animate-safety-blink"
        );
      case 'info':
        return cn(
          baseStyles,
          "bg-gradient-to-r from-primary/10 to-primary/5 border-l-primary text-primary-foreground"
        );
      default:
        return baseStyles;
    }
  };

  const getIconColor = () => {
    switch (status) {
      case 'safe':
        return "text-success";
      case 'caution':
        return "text-info";
      case 'warning':
        return "text-warning";
      case 'critical':
        return "text-destructive";
      case 'emergency':
        return "text-emergency";
      case 'info':
        return "text-primary";
      default:
        return "text-muted-foreground";
    }
  };

  const getSeverityBadge = () => {
    if (!severity) return null;
    
    const severityStyles = {
      low: "bg-success/20 text-success border-success/30",
      medium: "bg-warning/20 text-warning border-warning/30", 
      high: "bg-destructive/20 text-destructive border-destructive/30",
      critical: "bg-emergency/20 text-emergency border-emergency/30"
    };

    return (
      <span className={cn(
        "px-2 py-1 rounded-md text-xs font-medium border",
        severityStyles[severity]
      )}>
        {severity.toUpperCase()}
      </span>
    );
  };

  return (
    <div className={cn(getStatusStyles(), className)} role="alert">
      <div className={cn("flex-shrink-0", getIconColor())}>
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className={cn(
            "text-sm font-medium leading-relaxed",
            status === 'safe' ? 'text-success-foreground' :
            status === 'caution' ? 'text-info-foreground' :
            status === 'warning' ? 'text-warning-foreground' :
            status === 'critical' ? 'text-destructive-foreground' :
            status === 'emergency' ? 'text-emergency-foreground' :
            'text-primary-foreground'
          )}>
            {message}
          </p>
          {getSeverityBadge()}
        </div>
      </div>
      
      {/* Pulse indicator for critical statuses */}
      {(status === 'emergency' || status === 'critical') && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emergency rounded-full animate-ping" />
      )}
    </div>
  );
};

export default MedicalStatusIndicator;