import React from 'react';
import { MedicationReminders } from '@/components/MedicationReminders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EnhancedCard } from '@/components/ui/enhanced/EnhancedCard';
import { Bell, Clock, Pill } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import EnhancedMobileLayout from '@/components/EnhancedMobileLayout';

const Reminders = () => {
  const isMobile = useIsMobile();

  const content = (
    <div className={`min-h-screen ${!isMobile ? 'bg-gradient-to-br from-background via-primary-light/30 to-secondary-light/20' : ''}`}>
      <div className={!isMobile ? 'max-w-6xl mx-auto px-4 py-8' : ''}>
        {/* Header - Only show on desktop */}
        {!isMobile && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Medication Reminders</h1>
                <p className="text-muted-foreground">Never miss a dose with smart notifications</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className={`grid gap-4 mb-8 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-3 gap-6'}`}>
          <EnhancedCard 
            variant="glass"
            className="animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            <CardContent className={isMobile ? 'p-4' : 'p-6'}>
              <div className="flex items-center gap-4">
                <div className={`rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-glow ${
                  isMobile ? 'w-10 h-10' : 'w-12 h-12'
                }`}>
                  <Clock className={`text-primary ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
                </div>
                <div>
                  <h3 className={`font-bold text-foreground ${isMobile ? 'text-xl' : 'text-2xl'}`}>0</h3>
                  <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>Active Reminders</p>
                </div>
              </div>
            </CardContent>
          </EnhancedCard>
          
          <EnhancedCard 
            variant="glass"
            className="animate-fade-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            <CardContent className={isMobile ? 'p-4' : 'p-6'}>
              <div className="flex items-center gap-4">
                <div className={`rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center shadow-glow ${
                  isMobile ? 'w-10 h-10' : 'w-12 h-12'
                }`}>
                  <Pill className={`text-secondary ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
                </div>
                <div>
                  <h3 className={`font-bold text-foreground ${isMobile ? 'text-xl' : 'text-2xl'}`}>0</h3>
                  <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>Medications</p>
                </div>
              </div>
            </CardContent>
          </EnhancedCard>
          
          <EnhancedCard 
            variant="glass"
            className="animate-fade-in-up"
            style={{ animationDelay: '0.3s' }}
          >
            <CardContent className={isMobile ? 'p-4' : 'p-6'}>
              <div className="flex items-center gap-4">
                <div className={`rounded-2xl bg-gradient-to-br from-warning/20 to-warning/10 flex items-center justify-center shadow-glow ${
                  isMobile ? 'w-10 h-10' : 'w-12 h-12'
                }`}>
                  <Bell className={`text-warning ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
                </div>
                <div>
                  <h3 className={`font-bold text-foreground ${isMobile ? 'text-xl' : 'text-2xl'}`}>0</h3>
                  <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>Today's Doses</p>
                </div>
              </div>
            </CardContent>
          </EnhancedCard>
        </div>

        {/* Main Content */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <MedicationReminders />
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <EnhancedMobileLayout title="Reminders">
        {content}
      </EnhancedMobileLayout>
    );
  }

  return content;
};

export default Reminders;