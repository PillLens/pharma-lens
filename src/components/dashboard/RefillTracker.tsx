import React from 'react';
import { Pill, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TranslatedText } from '@/components/TranslatedText';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface RefillItem {
  id: string;
  medicationName: string;
  quantityRemaining: number;
  dailyDoseCount: number;
  daysUntilRefill: number;
  refillReminderDate?: Date;
  lastRefillDate?: Date;
}

interface RefillTrackerProps {
  items: RefillItem[];
  onRequestRefill?: (id: string) => void;
  className?: string;
}

export const RefillTracker: React.FC<RefillTrackerProps> = ({
  items,
  onRequestRefill,
  className
}) => {
  const getStockStatus = (daysRemaining: number) => {
    if (daysRemaining <= 0) return { status: 'critical', label: 'Out of Stock', color: 'text-destructive' };
    if (daysRemaining <= 3) return { status: 'urgent', label: 'Refill Now', color: 'text-destructive' };
    if (daysRemaining <= 7) return { status: 'low', label: 'Low Stock', color: 'text-warning' };
    if (daysRemaining <= 14) return { status: 'moderate', label: 'Stock OK', color: 'text-info' };
    return { status: 'good', label: 'Stock Good', color: 'text-success' };
  };

  const getStockPercentage = (item: RefillItem) => {
    const totalDays = 30; // Assume 30-day supply as standard
    return Math.max(0, Math.min(100, (item.daysUntilRefill / totalDays) * 100));
  };

  const sortedItems = [...items].sort((a, b) => a.daysUntilRefill - b.daysUntilRefill);

  const urgentRefills = items.filter(item => item.daysUntilRefill <= 7).length;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">
              <TranslatedText translationKey="dashboard.refill.title" fallback="Refill Tracker" />
            </CardTitle>
          </div>
          {urgentRefills > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="w-3 h-3" />
              {urgentRefills} urgent
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Pill className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              <TranslatedText 
                translationKey="dashboard.refill.noData" 
                fallback="No medications tracked for refills" 
              />
            </p>
            <p className="text-xs mt-1">
              <TranslatedText 
                translationKey="dashboard.refill.addQuantity" 
                fallback="Add quantity info to your medications to track refills" 
              />
            </p>
          </div>
        ) : (
          sortedItems.map((item) => {
            const stockStatus = getStockStatus(item.daysUntilRefill);
            const percentage = getStockPercentage(item);

            return (
              <div
                key={item.id}
                className={cn(
                  'rounded-lg border p-3 transition-all',
                  stockStatus.status === 'critical' && 'border-destructive/50 bg-destructive/5',
                  stockStatus.status === 'urgent' && 'border-destructive/30 bg-destructive/5',
                  stockStatus.status === 'low' && 'border-warning/30 bg-warning/5'
                )}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {item.medicationName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="secondary" 
                        className={cn('text-xs', stockStatus.color)}
                      >
                        {stockStatus.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {item.daysUntilRefill} days left
                      </span>
                    </div>
                  </div>

                  {stockStatus.status === 'urgent' || stockStatus.status === 'critical' ? (
                    onRequestRefill && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onRequestRefill(item.id)}
                        className="text-xs h-8 shrink-0"
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        <TranslatedText 
                          translationKey="dashboard.refill.request" 
                          fallback="Refill" 
                        />
                      </Button>
                    )
                  ) : (
                    <CheckCircle className="w-5 h-5 text-success shrink-0" />
                  )}
                </div>

                {/* Stock progress bar */}
                <div className="space-y-1">
                  <Progress 
                    value={percentage} 
                    className={cn(
                      'h-2',
                      stockStatus.status === 'critical' && '[&>div]:bg-destructive',
                      stockStatus.status === 'urgent' && '[&>div]:bg-destructive',
                      stockStatus.status === 'low' && '[&>div]:bg-warning',
                      stockStatus.status === 'moderate' && '[&>div]:bg-info',
                      stockStatus.status === 'good' && '[&>div]:bg-success'
                    )}
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{item.quantityRemaining} doses left</span>
                    <span>{item.dailyDoseCount}x daily</span>
                  </div>
                </div>

                {/* Last refill date */}
                {item.lastRefillDate && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>
                      <TranslatedText 
                        translationKey="dashboard.refill.lastRefill" 
                        fallback="Last refill:" 
                      />
                      {' '}
                      {item.lastRefillDate.toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
