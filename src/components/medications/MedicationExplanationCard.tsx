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
    <MobileCard className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
      <MobileCardHeader>
        <MobileCardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          <TranslatedText translationKey="medication.explanation.title" />
        </MobileCardTitle>
      </MobileCardHeader>
      <MobileCardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <Pill className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium text-sm">
              <TranslatedText translationKey="medication.explanation.addMeds" />
            </p>
            <p className="text-xs text-muted-foreground">
              <TranslatedText translationKey="medication.explanation.addMedsDesc" />
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <Bell className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium text-sm">
              <TranslatedText translationKey="medication.explanation.setReminders" />
            </p>
            <p className="text-xs text-muted-foreground">
              <TranslatedText translationKey="medication.explanation.setRemindersDesc" />
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium text-sm">
              <TranslatedText translationKey="medication.explanation.trackAdherence" />
            </p>
            <p className="text-xs text-muted-foreground">
              <TranslatedText translationKey="medication.explanation.trackAdherenceDesc" />
            </p>
          </div>
        </div>
        
        <Button 
          onClick={onNavigateToReminders}
          className="w-full mt-4"
          variant="outline"
        >
          <Clock className="h-4 w-4 mr-2" />
          <TranslatedText translationKey="medication.explanation.viewReminders" />
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </MobileCardContent>
    </MobileCard>
  );
};
export default MedicationExplanationCard;