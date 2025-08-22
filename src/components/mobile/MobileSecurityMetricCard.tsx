import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info, Shield, Lock, Eye, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MobileSecurityMetricCardProps {
  title: string;
  icon: React.ReactNode;
  value: number | string;
  maxValue?: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  description: string;
  details?: Array<{
    label: string;
    value: string | number;
    status?: 'success' | 'warning' | 'error';
  }>;
  helpText?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'excellent': return 'text-green-600';
    case 'good': return 'text-blue-600';
    case 'warning': return 'text-orange-600';
    case 'critical': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

const getStatusBg = (status: string) => {
  switch (status) {
    case 'excellent': return 'bg-green-500';
    case 'good': return 'bg-blue-500';
    case 'warning': return 'bg-orange-500';
    case 'critical': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const getProgressColor = (status: string) => {
  switch (status) {
    case 'excellent': return 'hsl(var(--chart-2))'; // Green
    case 'good': return 'hsl(var(--chart-1))'; // Blue
    case 'warning': return 'hsl(var(--chart-3))'; // Orange
    case 'critical': return 'hsl(var(--destructive))'; // Red
    default: return 'hsl(var(--muted))';
  }
};

export const MobileSecurityMetricCard: React.FC<MobileSecurityMetricCardProps> = ({
  title,
  icon,
  value,
  maxValue = 100,
  status,
  description,
  details,
  helpText
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const numericValue = typeof value === 'number' ? value : parseInt(value.toString()) || 0;
  const progressPercentage = (numericValue / maxValue) * 100;

  return (
    <Card className="medical-surface border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${getStatusBg(status)}/10`}>
              <div className={getStatusColor(status)}>
                {icon}
              </div>
            </div>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {helpText && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-48">{helpText}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Circular Progress or Simple Display */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {typeof value === 'number' && maxValue === 100 ? (
              // Circular progress for percentage values
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 42 42">
                  <circle
                    cx="21"
                    cy="21"
                    r="18"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="4"
                  />
                  <circle
                    cx="21"
                    cy="21"
                    r="18"
                    fill="none"
                    stroke={getProgressColor(status)}
                    strokeWidth="4"
                    strokeDasharray={`${progressPercentage * 1.13} 113`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-xs font-semibold ${getStatusColor(status)}`}>
                    {numericValue}%
                  </span>
                </div>
              </div>
            ) : (
              // Large value display for non-percentage values
              <div className="text-2xl font-bold text-foreground">
                {value}
              </div>
            )}
            
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{description}</p>
              <Badge 
                variant="outline" 
                className={`text-xs mt-1 ${getStatusColor(status)} border-current`}
              >
                {status === 'excellent' ? 'Excellent' : 
                 status === 'good' ? 'Good' : 
                 status === 'warning' ? 'Needs Attention' : 'Critical'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Progress Bar for non-circular displays */}
        {typeof value === 'number' && maxValue !== 100 && (
          <div className="mb-3">
            <Progress 
              value={progressPercentage} 
              className="h-2"
              style={{ 
                '--progress-foreground': getProgressColor(status) 
              } as React.CSSProperties}
            />
          </div>
        )}

        {/* Collapsible Details */}
        {details && details.length > 0 && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-between h-8 text-xs"
              >
                Advanced Details
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {details.map((detail, index) => (
                <div key={index} className="flex justify-between items-center py-1 border-b border-border/30 last:border-0">
                  <span className="text-xs text-muted-foreground">{detail.label}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium">{detail.value}</span>
                    {detail.status && (
                      <div className={`w-2 h-2 rounded-full ${
                        detail.status === 'success' ? 'bg-green-500' :
                        detail.status === 'warning' ? 'bg-orange-500' :
                        'bg-red-500'
                      }`} />
                    )}
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
};