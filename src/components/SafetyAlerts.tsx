import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Info, AlertCircle } from 'lucide-react';
import { MedicationSafetyProfile, SafetyAlert } from '@/services/safetyService';

interface SafetyAlertsProps {
  safetyProfile: MedicationSafetyProfile;
  className?: string;
}

const SafetyAlerts: React.FC<SafetyAlertsProps> = ({ safetyProfile, className = '' }) => {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Shield className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!safetyProfile.alerts.length && !safetyProfile.interactions.length) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-500" />
          <span className="text-sm font-medium text-green-700">No safety concerns detected</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overall Risk Level */}
      <div className={`p-3 rounded-lg border ${getRiskLevelColor(safetyProfile.riskLevel)}`}>
        <div className="flex items-center justify-between">
          <span className="font-medium">Overall Risk Level</span>
          <Badge variant={safetyProfile.riskLevel === 'critical' ? 'destructive' : 'secondary'}>
            {safetyProfile.riskLevel.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Safety Alerts */}
      {safetyProfile.alerts.map((alert, index) => (
        <Alert key={index} className={
          alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
          alert.severity === 'warning' ? 'border-orange-500 bg-orange-50' :
          'border-blue-500 bg-blue-50'
        }>
          <div className="flex items-start gap-3">
            {getSeverityIcon(alert.severity)}
            <div className="flex-1 space-y-2">
              <AlertTitle className="flex items-center gap-2">
                {alert.title}
                <Badge variant={getSeverityBadgeVariant(alert.severity)} className="text-xs">
                  {alert.severity.toUpperCase()}
                </Badge>
              </AlertTitle>
              <AlertDescription className="text-sm">
                {alert.description}
              </AlertDescription>
              {alert.actions.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-700 mb-1">Recommended Actions:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {alert.actions.map((action, actionIndex) => (
                      <li key={actionIndex} className="flex items-start gap-1">
                        <span className="text-gray-400 mt-0.5">•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Alert>
      ))}

      {/* Drug Interactions */}
      {safetyProfile.interactions.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Drug Interactions ({safetyProfile.interactions.length})
          </h4>
          {safetyProfile.interactions.map((interaction, index) => (
            <Alert key={index} className="border-orange-500 bg-orange-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-sm">
                {interaction.drug1} + {interaction.drug2}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {interaction.severity.toUpperCase()}
                </Badge>
              </AlertTitle>
              <AlertDescription className="text-xs">
                <p className="mb-1">{interaction.description}</p>
                <p className="font-medium">Management: {interaction.management}</p>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Monitoring Requirements */}
      {safetyProfile.monitoringRequired.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-sm text-blue-800 mb-2 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Monitoring Required
          </h4>
          <ul className="text-xs text-blue-700 space-y-1">
            {safetyProfile.monitoringRequired.map((requirement, index) => (
              <li key={index} className="flex items-start gap-1">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>{requirement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SafetyAlerts;