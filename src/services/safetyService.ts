import { comprehensiveMedications, drugInteractions, safetyThresholds } from '@/data/comprehensiveMedications';

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'major' | 'moderate' | 'minor';
  description: string;
  management: string;
}

export interface SafetyAlert {
  type: 'interaction' | 'risk' | 'monitoring' | 'contraindication';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  actions: string[];
}

export interface MedicationSafetyProfile {
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  alerts: SafetyAlert[];
  interactions: DrugInteraction[];
  monitoringRequired: string[];
}

class SafetyService {
  // Check for drug interactions
  checkDrugInteractions(currentMedication: string, userMedications: string[]): DrugInteraction[] {
    const interactions: DrugInteraction[] = [];
    
    // Normalize medication names for comparison
    const currentGeneric = this.extractGenericName(currentMedication);
    
    userMedications.forEach(userMed => {
      const userGeneric = this.extractGenericName(userMed);
      
      // Check all interaction databases
      [...drugInteractions.major, ...drugInteractions.moderate, ...drugInteractions.minor].forEach(interaction => {
        if (
          (interaction.drug1.toLowerCase() === currentGeneric.toLowerCase() && 
           interaction.drug2.toLowerCase() === userGeneric.toLowerCase()) ||
          (interaction.drug2.toLowerCase() === currentGeneric.toLowerCase() && 
           interaction.drug1.toLowerCase() === userGeneric.toLowerCase())
        ) {
          interactions.push(interaction as DrugInteraction);
        }
      });
    });
    
    return interactions;
  }

  // Assess overall medication safety
  assessMedicationSafety(
    medication: any, 
    userMedications: string[] = [],
    userConditions: string[] = [],
    confidence: number = 1.0
  ): MedicationSafetyProfile {
    const alerts: SafetyAlert[] = [];
    const interactions = this.checkDrugInteractions(medication.genericName, userMedications);
    const monitoringRequired: string[] = [];

    // Check confidence score
    if (confidence < safetyThresholds.confidence.minimum) {
      alerts.push({
        type: 'risk',
        severity: 'critical',
        title: 'Low Recognition Confidence',
        description: `Medication recognition confidence is ${(confidence * 100).toFixed(1)}%. This medication may not have been identified correctly.`,
        actions: ['Verify medication manually', 'Consult healthcare provider', 'Do not take if unsure']
      });
    } else if (confidence < safetyThresholds.confidence.warning) {
      alerts.push({
        type: 'risk',
        severity: 'warning',
        title: 'Moderate Recognition Confidence',
        description: `Medication recognition confidence is ${(confidence * 100).toFixed(1)}%. Please verify the medication details.`,
        actions: ['Double-check medication name and strength', 'Verify with packaging or prescription']
      });
    }

    // Check risk flags
    if (medication.riskFlags) {
      medication.riskFlags.forEach((flag: string) => {
        const riskInfo = safetyThresholds.riskFlags[flag as keyof typeof safetyThresholds.riskFlags];
        if (riskInfo) {
          alerts.push({
            type: 'risk',
            severity: flag.includes('HIGH_RISK') || flag.includes('SUICIDE') ? 'critical' : 'warning',
            title: riskInfo.description,
            description: `This medication has been flagged as: ${riskInfo.description}`,
            actions: riskInfo.actions
          });

          if (flag.includes('MONITORING')) {
            monitoringRequired.push(riskInfo.description);
          }
        }
      });
    }

    // Check contraindications against user conditions
    if (medication.contraindications && userConditions.length > 0) {
      medication.contraindications.forEach((contraindication: string) => {
        userConditions.forEach(condition => {
          if (contraindication.toLowerCase().includes(condition.toLowerCase()) ||
              condition.toLowerCase().includes(contraindication.toLowerCase().split(' ')[0])) {
            alerts.push({
              type: 'contraindication',
              severity: 'critical',
              title: 'Contraindication Detected',
              description: `This medication is contraindicated for: ${contraindication}`,
              actions: ['Do not take this medication', 'Consult healthcare provider immediately']
            });
          }
        });
      });
    }

    // Add interaction alerts
    interactions.forEach(interaction => {
      alerts.push({
        type: 'interaction',
        severity: interaction.severity === 'major' ? 'critical' : interaction.severity === 'moderate' ? 'warning' : 'info',
        title: `Drug Interaction: ${interaction.severity.toUpperCase()}`,
        description: interaction.description,
        actions: [interaction.management]
      });
    });

    // Determine overall risk level
    let riskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
    
    if (alerts.some(alert => alert.severity === 'critical')) {
      riskLevel = 'critical';
    } else if (alerts.some(alert => alert.severity === 'warning') || interactions.length > 0) {
      riskLevel = 'high';
    } else if (medication.riskFlags?.length > 0) {
      riskLevel = 'moderate';
    }

    return {
      riskLevel,
      alerts,
      interactions,
      monitoringRequired
    };
  }

  // Validate dosage safety
  validateDosage(medication: any, proposedDose: string, patientAge?: number, patientWeight?: number): SafetyAlert[] {
    const alerts: SafetyAlert[] = [];

    // Basic age-based warnings
    if (patientAge && patientAge < 18 && !medication.indications?.some((ind: string) => 
      ind.toLowerCase().includes('children') || ind.toLowerCase().includes('pediatric'))) {
      alerts.push({
        type: 'risk',
        severity: 'warning',
        title: 'Pediatric Use Warning',
        description: 'This medication may not be suitable for children. Verify pediatric dosing.',
        actions: ['Consult pediatrician', 'Verify age-appropriate dosing']
      });
    }

    if (patientAge && patientAge > 65 && medication.warnings?.some((warning: string) => 
      warning.toLowerCase().includes('elderly'))) {
      alerts.push({
        type: 'monitoring',
        severity: 'info',
        title: 'Elderly Patient Consideration',
        description: 'Special considerations may apply for elderly patients.',
        actions: ['Consider dose adjustment', 'Monitor more frequently']
      });
    }

    return alerts;
  }

  // Extract generic name from various medication formats
  private extractGenericName(medicationName: string): string {
    // Try to find matching medication in our database
    const medEntries = Object.entries(comprehensiveMedications);
    const found = medEntries.find(([_, med]) => 
      med.genericName.toLowerCase().includes(medicationName.toLowerCase()) ||
      med.brandName.toLowerCase().includes(medicationName.toLowerCase()) ||
      medicationName.toLowerCase().includes(med.genericName.toLowerCase())
    );
    
    if (found) {
      return found[1].genericName;
    }
    
    // Fallback: return the input name cleaned up
    return medicationName.toLowerCase().replace(/[^a-z\s]/g, '').trim();
  }

  // Generate medication safety report
  generateSafetyReport(medication: any, safetyProfile: MedicationSafetyProfile): string {
    let report = `MEDICATION SAFETY ASSESSMENT\n`;
    report += `Medication: ${medication.brandName} (${medication.genericName})\n`;
    report += `Overall Risk Level: ${safetyProfile.riskLevel.toUpperCase()}\n\n`;

    if (safetyProfile.alerts.length > 0) {
      report += `SAFETY ALERTS:\n`;
      safetyProfile.alerts.forEach((alert, index) => {
        report += `${index + 1}. [${alert.severity.toUpperCase()}] ${alert.title}\n`;
        report += `   ${alert.description}\n`;
        report += `   Actions: ${alert.actions.join(', ')}\n\n`;
      });
    }

    if (safetyProfile.interactions.length > 0) {
      report += `DRUG INTERACTIONS:\n`;
      safetyProfile.interactions.forEach((interaction, index) => {
        report += `${index + 1}. ${interaction.drug1} + ${interaction.drug2} (${interaction.severity})\n`;
        report += `   ${interaction.description}\n`;
        report += `   Management: ${interaction.management}\n\n`;
      });
    }

    if (safetyProfile.monitoringRequired.length > 0) {
      report += `MONITORING REQUIRED:\n`;
      safetyProfile.monitoringRequired.forEach((item, index) => {
        report += `${index + 1}. ${item}\n`;
      });
    }

    return report;
  }
}

export const safetyService = new SafetyService();