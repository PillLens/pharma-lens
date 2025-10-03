import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Info, Pill, Shield, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { drugInteractionService } from '@/services/drugInteractionService';
import { UserMedication } from '@/hooks/useMedicationHistory';
import { cn } from '@/lib/utils';

interface DrugInteractionCheckerProps {
  medications: UserMedication[];
  className?: string;
}

interface InteractionDisplay {
  id: string;
  drug1: string;
  drug2: string;
  severity: 'major' | 'moderate' | 'minor';
  description: string;
  management?: string;
}

export const DrugInteractionChecker: React.FC<DrugInteractionCheckerProps> = ({
  medications,
  className
}) => {
  const [loading, setLoading] = useState(true);
  const [interactions, setInteractions] = useState<InteractionDisplay[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkInteractions = async () => {
      if (medications.length < 2) {
        setInteractions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get all active medications
        const activeMeds = medications.filter(m => m.is_active);
        const medNames = activeMeds.map(m => m.generic_name || m.medication_name);

        // Check interactions between all pairs
        const allInteractions: InteractionDisplay[] = [];
        
        const result = await drugInteractionService.checkInteractionsExternal(medNames);
        
        if (result && result.interactions.length > 0) {
          // Map the interactions to display format
          result.interactions.forEach(interaction => {
            const drug1Med = activeMeds.find(m => 
              (m.generic_name || m.medication_name).toLowerCase().includes(interaction.drugA.toLowerCase()) ||
              interaction.drugA.toLowerCase().includes((m.generic_name || m.medication_name).toLowerCase())
            );
            const drug2Med = activeMeds.find(m => 
              (m.generic_name || m.medication_name).toLowerCase().includes(interaction.drugB.toLowerCase()) ||
              interaction.drugB.toLowerCase().includes((m.generic_name || m.medication_name).toLowerCase())
            );

            if (drug1Med && drug2Med) {
              allInteractions.push({
                id: `${drug1Med.id}-${drug2Med.id}`,
                drug1: drug1Med.medication_name,
                drug2: drug2Med.medication_name,
                severity: interaction.severity,
                description: interaction.description,
                management: interaction.management
              });
            }
          });
        }

        setInteractions(allInteractions);
      } catch (err) {
        console.error('Error checking interactions:', err);
        setError('Failed to check drug interactions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    checkInteractions();
  }, [medications]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'major':
        return 'text-destructive';
      case 'moderate':
        return 'text-warning';
      case 'minor':
        return 'text-info';
      default:
        return 'text-muted-foreground';
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'major':
        return 'bg-destructive/10 border-destructive/20';
      case 'moderate':
        return 'bg-warning/10 border-warning/20';
      case 'minor':
        return 'bg-info/10 border-info/20';
      default:
        return 'bg-muted/10 border-border';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'major':
        return <AlertTriangle className="w-5 h-5" />;
      case 'moderate':
        return <Info className="w-5 h-5" />;
      case 'minor':
        return <Shield className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  if (medications.length < 2) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Drug Interaction Checker
          </CardTitle>
          <CardDescription>
            Add at least 2 medications to check for interactions
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Drug Interaction Checker
          </CardTitle>
          <CardDescription>Checking your medications...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Drug Interaction Checker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Drug Interaction Checker
        </CardTitle>
        <CardDescription>
          {interactions.length === 0
            ? 'No interactions detected between your medications'
            : `${interactions.length} potential interaction${interactions.length > 1 ? 's' : ''} found`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {interactions.length === 0 ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/20">
            <CheckCircle className="w-6 h-6 text-success flex-shrink-0" />
            <div>
              <div className="font-medium text-foreground">All Clear!</div>
              <div className="text-sm text-success">
                No known interactions detected between your medications
              </div>
            </div>
          </div>
        ) : (
          <>
            {interactions.map((interaction) => (
              <div
                key={interaction.id}
                className={cn(
                  'p-4 rounded-xl border space-y-3',
                  getSeverityBg(interaction.severity)
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn('flex-shrink-0', getSeverityColor(interaction.severity))}>
                    {getSeverityIcon(interaction.severity)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="font-medium">
                        <Pill className="w-3 h-3 mr-1" />
                        {interaction.drug1}
                      </Badge>
                      <span className="text-muted-foreground">+</span>
                      <Badge variant="outline" className="font-medium">
                        <Pill className="w-3 h-3 mr-1" />
                        {interaction.drug2}
                      </Badge>
                      <Badge 
                        variant={interaction.severity === 'major' ? 'destructive' : 'secondary'}
                        className="ml-auto"
                      >
                        {interaction.severity.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-foreground">
                      {interaction.description}
                    </p>

                    {interaction.management && (
                      <Alert className="mt-2">
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          <strong>Management:</strong> {interaction.management}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                This information is for reference only. Always consult your healthcare provider or pharmacist about drug interactions.
              </AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  );
};
