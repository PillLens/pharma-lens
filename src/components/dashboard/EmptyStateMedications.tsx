import React from 'react';
import { Pill, Scan, Plus, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TranslatedText } from '@/components/TranslatedText';
import { Button } from '@/components/ui/button';

interface EmptyStateMedicationsProps {
  onAddMedication?: () => void;
  onScanBarcode?: () => void;
  className?: string;
}

export const EmptyStateMedications: React.FC<EmptyStateMedicationsProps> = ({
  onAddMedication,
  onScanBarcode,
  className
}) => {
  return (
    <Card className={className}>
      <CardContent className="p-12">
        <div className="text-center max-w-md mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <Pill className="w-10 h-10 text-primary" aria-hidden="true" />
          </div>
          
          <h3 className="text-2xl font-bold mb-3">
            <TranslatedText 
              translationKey="dashboard.emptyState.medications.title" 
              fallback="No Medications Yet" 
            />
          </h3>
          
          <p className="text-muted-foreground mb-8">
            <TranslatedText 
              translationKey="dashboard.emptyState.medications.description" 
              fallback="Start managing your health by adding your first medication" 
            />
          </p>

          <div className="space-y-3">
            {onScanBarcode && (
              <Button 
                size="lg" 
                onClick={onScanBarcode}
                className="w-full gap-2"
                aria-label="Scan medication barcode"
              >
                <Scan className="w-5 h-5" />
                <TranslatedText 
                  translationKey="dashboard.emptyState.medications.scan" 
                  fallback="Scan Medication" 
                />
              </Button>
            )}
            
            {onAddMedication && (
              <Button 
                size="lg" 
                variant="outline"
                onClick={onAddMedication}
                className="w-full gap-2"
                aria-label="Add medication manually"
              >
                <Plus className="w-5 h-5" />
                <TranslatedText 
                  translationKey="dashboard.emptyState.medications.manual" 
                  fallback="Add Manually" 
                />
              </Button>
            )}
          </div>

          <div className="mt-8 pt-8 border-t">
            <div className="flex items-start gap-3 text-left text-sm text-muted-foreground">
              <FileText className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
              <p>
                <TranslatedText 
                  translationKey="dashboard.emptyState.medications.tip" 
                  fallback="Tip: You can also upload a photo of your medication label for quick entry" 
                />
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
