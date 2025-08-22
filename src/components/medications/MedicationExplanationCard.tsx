import React from 'react';
import { Pill, Bell, Calendar, Info, ArrowRight, Clock, CheckCircle } from 'lucide-react';
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle } from '@/components/ui/mobile/MobileCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TranslatedText } from '@/components/TranslatedText';

interface MedicationExplanationCardProps {
  onNavigateToReminders: () => void;
}

const MedicationExplanationCard: React.FC<MedicationExplanationCardProps> = ({ 
  onNavigateToReminders 
}) => {
  return (
    <MobileCard className="bg-gradient-to-br from-info/5 to-info/10 border-info/20 mb-4">
      <MobileCardHeader>
        <MobileCardTitle className="flex items-center gap-2 text-base">
          <Info className="w-5 h-5 text-info" />
          <TranslatedText translationKey="medications.howItWorks" fallback="How It Works" />
        </MobileCardTitle>
      </MobileCardHeader>
      <MobileCardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Pill className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">1. Add Medications</div>
              <div className="text-xs text-muted-foreground">
                Add your prescriptions and over-the-counter medications here
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
            <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4 text-warning" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">2. Set Reminders</div>
              <div className="text-xs text-muted-foreground">
                Go to Reminders to set specific times for each medication
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
            <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-success" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">3. Track Adherence</div>
              <div className="text-xs text-muted-foreground">
                Use "Mark Taken" button when medications are due to track your progress
              </div>
            </div>
          </div>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={onNavigateToReminders}
          className="w-full rounded-lg"
        >
          <Bell className="w-4 h-4 mr-2" />
          <TranslatedText translationKey="medications.setReminders" fallback="Set Up Reminders" />
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </MobileCardContent>
    </MobileCard>
  );
};

export default MedicationExplanationCard;