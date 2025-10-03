import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TranslatedText } from '@/components/TranslatedText';

interface ErrorCardProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({ 
  message, 
  onRetry,
  className 
}) => {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          <TranslatedText translationKey="dashboard.error.title" fallback="Failed to Load Dashboard" />
        </h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          {message || <TranslatedText translationKey="dashboard.error.message" fallback="We couldn't load your dashboard data. Please try again." />}
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="default" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            <TranslatedText translationKey="common.retry" fallback="Retry" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
