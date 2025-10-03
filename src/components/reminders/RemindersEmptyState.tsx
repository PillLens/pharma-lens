import React from 'react';
import { Bell, Clock, Plus, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';

interface RemindersEmptyStateProps {
  onAddReminder: () => void;
}

const RemindersEmptyState: React.FC<RemindersEmptyStateProps> = ({ onAddReminder }) => {
  const { t } = useTranslation();

  return (
    <div className="px-4 py-8">
      <Card className="rounded-2xl shadow-md border-0 bg-card">
        <CardContent className="p-8 text-center">
          {/* Illustration */}
          <div className="relative mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bell className="w-8 h-8 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-warning/20 flex items-center justify-center">
                  <Clock className="w-3 h-3 text-warning" />
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4 mb-6">
            <h3 className="text-xl font-semibold text-foreground">
              {t('reminders.empty.title')}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('reminders.empty.subtitle')}
            </p>
          </div>

          {/* Benefits */}
          <div className="grid gap-3 mb-6 text-left">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <Zap className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Get notified at the perfect time for every dose
              </p>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-success/5 border border-success/10">
              <Shield className="w-4 h-4 text-success flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Never miss important medications again
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* CTA Button - Outside Card */}
      <div className="mt-6 px-4">
        <Button 
          onClick={onAddReminder}
          size="lg"
          className="w-full rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('reminders.empty.createButton')}
        </Button>
      </div>
    </div>
  );
};

export default RemindersEmptyState;