import React from 'react';
import { Bell, Clock, Smartphone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TranslatedText } from '@/components/TranslatedText';
import { Button } from '@/components/ui/button';

interface EmptyStateRemindersProps {
  onCreateReminder?: () => void;
  className?: string;
}

export const EmptyStateReminders: React.FC<EmptyStateRemindersProps> = ({
  onCreateReminder,
  className
}) => {
  const benefits = [
    {
      icon: Clock,
      title: 'Never Miss a Dose',
      description: 'Get notified at the right time'
    },
    {
      icon: Smartphone,
      title: 'Smart Notifications',
      description: 'Push notifications on all devices'
    },
    {
      icon: Bell,
      title: 'Customizable Alerts',
      description: 'Set your preferred reminder times'
    }
  ];

  return (
    <Card className={className}>
      <CardContent className="p-12">
        <div className="text-center max-w-md mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-warning/10 mb-6">
            <Bell className="w-10 h-10 text-warning" aria-hidden="true" />
          </div>
          
          <h3 className="text-2xl font-bold mb-3">
            <TranslatedText 
              translationKey="dashboard.emptyState.reminders.title" 
              fallback="No Reminders Set" 
            />
          </h3>
          
          <p className="text-muted-foreground mb-8">
            <TranslatedText 
              translationKey="dashboard.emptyState.reminders.description" 
              fallback="Create your first reminder to stay on track with your medications" 
            />
          </p>

          <div className="grid gap-4 mb-8 text-left">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div 
                  key={index} 
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                  role="listitem"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 shrink-0">
                    <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">{benefit.title}</h4>
                    <p className="text-xs text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {onCreateReminder && (
            <Button 
              size="lg" 
              onClick={onCreateReminder}
              className="w-full gap-2"
              aria-label="Create your first reminder"
            >
              <Bell className="w-5 h-5" />
              <TranslatedText 
                translationKey="dashboard.emptyState.reminders.create" 
                fallback="Create Reminder" 
              />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
