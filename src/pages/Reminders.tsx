import React from 'react';
import { MedicationReminders } from '@/components/MedicationReminders';
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle } from '@/components/ui/mobile/MobileCard';
import { Bell, Clock, Pill } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import ProfessionalMobileLayout from '@/components/mobile/ProfessionalMobileLayout';

const Reminders = () => {
  const isMobile = useIsMobile();

  const content = (
    <div className={`${!isMobile ? 'min-h-screen bg-gradient-to-br from-background via-primary-light/20 to-secondary-light/10' : ''}`}>
      <div className={!isMobile ? 'max-w-6xl mx-auto px-4 py-8' : 'px-4 py-6'}>
        {/* Header - Only show on desktop */}
        {!isMobile && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
                <Bell className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Medication Reminders</h1>
                <p className="text-muted-foreground">Never miss a dose with smart notifications</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className={`grid gap-4 mb-8 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-3'}`}>
          <MobileCard variant="elevated">
            <MobileCardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">0</h3>
                  <p className="text-sm text-muted-foreground">Active Reminders</p>
                </div>
              </div>
            </MobileCardContent>
          </MobileCard>
          
          <MobileCard variant="elevated">
            <MobileCardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Pill className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">0</h3>
                  <p className="text-sm text-muted-foreground">Medications</p>
                </div>
              </div>
            </MobileCardContent>
          </MobileCard>
          
          <MobileCard variant="elevated">
            <MobileCardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">0</h3>
                  <p className="text-sm text-muted-foreground">Today's Doses</p>
                </div>
              </div>
            </MobileCardContent>
          </MobileCard>
        </div>

        {/* Main Content */}
        <div>
          <MedicationReminders />
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <ProfessionalMobileLayout title="Reminders">
        {content}
      </ProfessionalMobileLayout>
    );
  }

  return content;
};

export default Reminders;