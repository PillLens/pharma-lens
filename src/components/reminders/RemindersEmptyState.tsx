import React from 'react';
import { Bell, Clock, Plus, Zap, Shield, ArrowRight, Pill, Calendar, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';

interface RemindersEmptyStateProps {
  onAddReminder: () => void;
}

const RemindersEmptyState: React.FC<RemindersEmptyStateProps> = ({ onAddReminder }) => {
  const { t } = useTranslation();

  return (
    <div className="px-4 py-8 animate-fade-in">
      <Card className="rounded-3xl shadow-lg border-0 bg-gradient-to-br from-card to-primary/5 overflow-hidden">
        <CardContent className="p-8 text-center relative">
          {/* Animated Background Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-success/5 rounded-full blur-3xl animate-pulse delay-1000" />
          
          {/* Illustration */}
          <div className="relative mb-6 z-10">
            <div className="flex items-center justify-center mb-4">
              <div className="relative animate-scale-in">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-lg">
                  <Bell className="w-10 h-10 text-white animate-pulse" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-warning to-warning-light flex items-center justify-center shadow-md animate-bounce">
                  <Clock className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4 mb-8 z-10 relative">
            <Badge variant="outline" className="mb-2 text-xs px-3 py-1">
              Get Started
            </Badge>
            <h3 className="text-2xl font-bold text-foreground">
              {t('reminders.empty.title')}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              Set up your first reminder and never miss a dose. We'll send you timely notifications to keep you on track.
            </p>
          </div>

          {/* Step-by-Step Guide */}
          <div className="space-y-3 mb-8 text-left max-w-md mx-auto z-10 relative">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Pill className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-foreground mb-1">
                  1. Add Your Medication
                </h4>
                <p className="text-xs text-muted-foreground">
                  Enter medication name, dosage, and frequency
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all animate-fade-in delay-100">
              <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Calendar className="w-4 h-4 text-success" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-foreground mb-1">
                  2. Set Reminder Times
                </h4>
                <p className="text-xs text-muted-foreground">
                  Choose when you want to be reminded each day
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all animate-fade-in delay-200">
              <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4 text-warning" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-foreground mb-1">
                  3. Stay on Track
                </h4>
                <p className="text-xs text-muted-foreground">
                  Mark doses as taken and track your progress
                </p>
              </div>
            </div>
          </div>

          {/* Quick Benefits */}
          <div className="grid grid-cols-2 gap-3 mb-6 text-left z-10 relative">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
              <Zap className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-xs text-muted-foreground font-medium">
                Smart Timing
              </p>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-success/5 border border-success/10">
              <Shield className="w-4 h-4 text-success flex-shrink-0" />
              <p className="text-xs text-muted-foreground font-medium">
                Never Miss
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
          className="w-full rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.97] bg-gradient-to-r from-primary to-primary-light group"
        >
          <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
          {t('reminders.empty.createButton', 'Create Your First Reminder')}
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
        </Button>
        
        <p className="text-center text-xs text-muted-foreground mt-4">
          ✨ Start your medication tracking journey today
        </p>
      </div>
    </div>
  );
};

export default RemindersEmptyState;