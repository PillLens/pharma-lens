import React from 'react';
import { Clock, CheckCircle, Circle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TranslatedText } from '@/components/TranslatedText';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TimelineItem {
  id: string;
  time: string;
  medication: {
    name: string;
    dosage: string;
  };
  status: 'taken' | 'pending' | 'missed' | 'upcoming';
  scheduledTime: Date;
  takenTime?: Date;
}

interface MedicationTimelineProps {
  items: TimelineItem[];
  onMarkAsTaken?: (id: string) => void;
  onSkip?: (id: string) => void;
  className?: string;
}

export const MedicationTimeline: React.FC<MedicationTimelineProps> = ({
  items,
  onMarkAsTaken,
  onSkip,
  className
}) => {
  const now = new Date();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'taken':
        return 'text-success bg-success/10 border-success/20';
      case 'pending':
        return 'text-warning bg-warning/10 border-warning/20';
      case 'missed':
        return 'text-destructive bg-destructive/10 border-destructive/20';
      case 'upcoming':
        return 'text-muted-foreground bg-muted/30 border-border';
      default:
        return 'text-muted-foreground bg-muted/30 border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taken':
        return <CheckCircle className="w-5 h-5" />;
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'missed':
        return <XCircle className="w-5 h-5" />;
      case 'upcoming':
        return <Circle className="w-5 h-5" />;
      default:
        return <Circle className="w-5 h-5" />;
    }
  };

  const sortedItems = [...items].sort((a, b) => 
    a.scheduledTime.getTime() - b.scheduledTime.getTime()
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">
            <TranslatedText translationKey="dashboard.timeline.title" fallback="Today's Schedule" />
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {sortedItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Circle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  <TranslatedText 
                    translationKey="dashboard.timeline.noDoses" 
                    fallback="No doses scheduled for today" 
                  />
                </p>
              </div>
            ) : (
              sortedItems.map((item, index) => {
                const isPast = item.scheduledTime < now;
                const isCurrent = item.status === 'pending';

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'relative pl-8 pb-4',
                      index !== sortedItems.length - 1 && 'border-l-2 border-border ml-2'
                    )}
                  >
                    {/* Timeline dot */}
                    <div className={cn(
                      'absolute left-0 top-0 w-4 h-4 rounded-full border-2',
                      getStatusColor(item.status),
                      'flex items-center justify-center -ml-2'
                    )}>
                      {item.status === 'taken' && (
                        <div className="w-2 h-2 rounded-full bg-success" />
                      )}
                    </div>

                    {/* Content */}
                    <div className={cn(
                      'rounded-lg border p-3 transition-all',
                      isCurrent && 'ring-2 ring-primary/20 border-primary/40 bg-primary/5',
                      item.status === 'taken' && 'opacity-70',
                      'hover:shadow-md'
                    )}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Time and status */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-semibold text-foreground">
                              {item.time}
                            </span>
                            <Badge 
                              variant="secondary" 
                              className={cn('text-xs', getStatusColor(item.status))}
                            >
                              {getStatusIcon(item.status)}
                              <span className="ml-1 capitalize">{item.status}</span>
                            </Badge>
                          </div>

                          {/* Medication info */}
                          <div>
                            <p className="font-medium text-foreground mb-0.5">
                              {item.medication.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.medication.dosage}
                            </p>
                          </div>

                          {/* Taken time */}
                          {item.takenTime && (
                            <p className="text-xs text-muted-foreground mt-2">
                              <TranslatedText 
                                translationKey="dashboard.timeline.takenAt" 
                                fallback="Taken at" 
                              />{' '}
                              {item.takenTime.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        {item.status === 'pending' && onMarkAsTaken && (
                          <div className="flex flex-col gap-1">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => onMarkAsTaken(item.id)}
                              className="text-xs h-8"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              <TranslatedText 
                                translationKey="dashboard.timeline.markTaken" 
                                fallback="Mark" 
                              />
                            </Button>
                            {onSkip && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onSkip(item.id)}
                                className="text-xs h-7"
                              >
                                <TranslatedText 
                                  translationKey="dashboard.timeline.skip" 
                                  fallback="Skip" 
                                />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
