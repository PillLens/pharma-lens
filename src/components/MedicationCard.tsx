import { Shield, AlertTriangle, CheckCircle, ExternalLink, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface MedicationInfo {
  brandName: string;
  genericName?: string;
  strength: string;
  form: string;
  manufacturer: string;
  indications?: string[];
  contraindications?: string[];
  warnings?: string[];
  sideEffects?: string[];
  howToUse?: {
    route?: string;
    withFood?: string;
    timing?: string;
    dosageText?: string;
  };
  storage?: string;
  riskFlags?: string[];
  qualityScore: number;
  sourceUrl?: string;
}

interface MedicationCardProps {
  medication: MedicationInfo;
  onViewSource?: () => void;
}

export const MedicationCard = ({ medication, onViewSource }: MedicationCardProps) => {
  const getRiskBadge = (flags: string[]) => {
    if (flags.includes("HIGH_RISK_MED")) {
      return { variant: "destructive", label: "High Risk", icon: AlertTriangle };
    }
    if (flags.includes("UNCERTAIN_MATCH")) {
      return { variant: "secondary", label: "Verify", icon: Shield };
    }
    return { variant: "default", label: "Verified", icon: CheckCircle };
  };

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return "text-success";
    if (score >= 0.6) return "text-warning";
    return "text-destructive";
  };

  const riskInfo = getRiskBadge(medication.riskFlags || []);
  const RiskIcon = riskInfo.icon;

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">
              {medication.brandName}
            </h1>
            {medication.genericName && (
              <p className="text-muted-foreground">
                Generic: {medication.genericName}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {medication.strength} • {medication.form} • {medication.manufacturer}
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <Badge 
              variant={riskInfo.variant as any}
              className="gap-1"
            >
              <RiskIcon className="w-3 h-3" />
              {riskInfo.label}
            </Badge>
            
            <div className="text-right text-xs text-muted-foreground">
              Quality: <span className={getQualityColor(medication.qualityScore)}>
                {Math.round(medication.qualityScore * 100)}%
              </span>
            </div>
          </div>
        </div>

        {medication.sourceUrl && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onViewSource}
            className="gap-2"
          >
            <ExternalLink className="w-3 h-3" />
            View Official Source
          </Button>
        )}
      </Card>

      {/* High Risk Warning */}
      {medication.riskFlags?.includes("HIGH_RISK_MED") && (
        <Card className="p-6 bg-destructive/10 border-destructive/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-destructive mb-2">High-Risk Medication</h3>
              <p className="text-sm text-muted-foreground">
                This medication requires special attention. Please consult with your pharmacist 
                or healthcare provider before use. Only official label information is shown below.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* What It's For */}
      {medication.indications && medication.indications.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            What It's For
          </h3>
          <ul className="space-y-2">
            {medication.indications.map((indication, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                {indication}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* How to Use */}
      {medication.howToUse && (
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            How to Use
          </h3>
          <div className="space-y-3 text-sm">
            {medication.howToUse.route && (
              <div>
                <span className="font-medium text-foreground">Route: </span>
                <span className="text-muted-foreground">{medication.howToUse.route}</span>
              </div>
            )}
            {medication.howToUse.withFood && (
              <div>
                <span className="font-medium text-foreground">With Food: </span>
                <span className="text-muted-foreground">{medication.howToUse.withFood}</span>
              </div>
            )}
            {medication.howToUse.timing && (
              <div>
                <span className="font-medium text-foreground">Timing: </span>
                <span className="text-muted-foreground">{medication.howToUse.timing}</span>
              </div>
            )}
            {medication.howToUse.dosageText && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <span className="font-medium text-foreground">Dosage (from label): </span>
                <span className="text-muted-foreground font-mono text-xs">
                  "{medication.howToUse.dosageText}"
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Who Should Not Use */}
      {medication.contraindications && medication.contraindications.length > 0 && (
        <Card className="p-6 bg-warning/10 border-warning/30">
          <h3 className="font-semibold text-warning mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Who Should Not Use
          </h3>
          <ul className="space-y-2">
            {medication.contraindications.map((contraindication, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-warning rounded-full mt-2 flex-shrink-0"></span>
                {contraindication}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Warnings & Side Effects */}
      {((medication.warnings && medication.warnings.length > 0) || 
        (medication.sideEffects && medication.sideEffects.length > 0)) && (
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Warnings & Side Effects
          </h3>
          
          {medication.warnings && medication.warnings.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-foreground mb-2">Warnings</h4>
              <ul className="space-y-1">
                {medication.warnings.map((warning, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-destructive rounded-full mt-2 flex-shrink-0"></span>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {medication.warnings && medication.warnings.length > 0 && 
           medication.sideEffects && medication.sideEffects.length > 0 && (
            <Separator className="my-4" />
          )}

          {medication.sideEffects && medication.sideEffects.length > 0 && (
            <div>
              <h4 className="font-medium text-foreground mb-2">Common Side Effects</h4>
              <ul className="space-y-1">
                {medication.sideEffects.map((effect, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-warning rounded-full mt-2 flex-shrink-0"></span>
                    {effect}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Storage */}
      {medication.storage && (
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-3">Storage Instructions</h3>
          <p className="text-sm text-muted-foreground">{medication.storage}</p>
        </Card>
      )}
    </div>
  );
};