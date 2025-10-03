import React from 'react';
import { Sparkles, ArrowRight, Pill, Bell, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TranslatedText } from '@/components/TranslatedText';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EmptyStateWelcomeProps {
  userName?: string;
  onStartTour?: () => void;
  onAddMedication?: () => void;
  className?: string;
}

export const EmptyStateWelcome: React.FC<EmptyStateWelcomeProps> = ({
  userName,
  onStartTour,
  onAddMedication,
  className
}) => {
  const steps = [
    {
      icon: Pill,
      title: 'Add Your First Medication',
      description: 'Scan or manually enter your medications',
      completed: false
    },
    {
      icon: Bell,
      title: 'Set Up Reminders',
      description: 'Never miss a dose with smart notifications',
      completed: false
    },
    {
      icon: Users,
      title: 'Invite Family',
      description: 'Share care with loved ones',
      completed: false
    }
  ];

  return (
    <Card className={className}>
      <CardContent className="p-8">
        <div className="text-center max-w-2xl mx-auto">
          {/* Hero section */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-3">
              <TranslatedText 
                translationKey="dashboard.welcome.title" 
                fallback={`Welcome${userName ? `, ${userName}` : ''}!`} 
              />
            </h2>
            <p className="text-lg text-muted-foreground">
              <TranslatedText 
                translationKey="dashboard.welcome.subtitle" 
                fallback="Let's get started with your medication management journey" 
              />
            </p>
          </div>

          {/* Getting started steps */}
          <div className="grid gap-4 mb-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left"
                  role="listitem"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
                    <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    Step {index + 1}
                  </Badge>
                </div>
              );
            })}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onAddMedication && (
              <Button 
                size="lg" 
                onClick={onAddMedication}
                className="gap-2"
                aria-label="Add your first medication"
              >
                <Pill className="w-5 h-5" />
                <TranslatedText 
                  translationKey="dashboard.welcome.addMedication" 
                  fallback="Add Your First Medication" 
                />
              </Button>
            )}
            {onStartTour && (
              <Button 
                size="lg" 
                variant="outline" 
                onClick={onStartTour}
                className="gap-2"
                aria-label="Take a quick tour"
              >
                <TranslatedText 
                  translationKey="dashboard.welcome.takeTour" 
                  fallback="Take a Tour" 
                />
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Help text */}
          <p className="text-sm text-muted-foreground mt-6">
            <TranslatedText 
              translationKey="dashboard.welcome.help" 
              fallback="Need help getting started? Check out our" 
            />
            {' '}
            <a 
              href="/help" 
              className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              aria-label="Go to help center"
            >
              <TranslatedText 
                translationKey="dashboard.welcome.helpCenter" 
                fallback="Help Center" 
              />
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
