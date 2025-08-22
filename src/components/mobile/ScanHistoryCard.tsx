import React from 'react';
import { Clock, AlertTriangle, CheckCircle, Pill, Shield, Star, Bookmark } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MobileCardContent, MobileCardHeader, MobileCardTitle, MobileCardDescription } from '@/components/ui/mobile/MobileCard';
import { MobileButton } from '@/components/ui/mobile/MobileButton';
import { format } from 'date-fns';
import SwipeableCard from './SwipeableCard';
import { cn } from '@/lib/utils';

interface ScanSession {
  id: string;
  created_at: string;
  barcode_value?: string;
  language: string;
  extraction_id?: string;
  selected_product_id?: string;
  extractions?: {
    extracted_json: any;
    quality_score: number;
    risk_flags: string[];
  };
  products?: {
    brand_name: string;
    generic_name?: string;
    strength?: string;
    form?: string;
  };
}

interface ScanHistoryCardProps {
  session: ScanSession;
  onView?: (session: ScanSession) => void;
  onExport?: (session: ScanSession) => void;
  onBookmark?: (sessionId: string) => void;
  onDelete?: (sessionId: string) => void;
  onArchive?: (sessionId: string) => void;
  isBookmarked?: boolean;
  className?: string;
}

const ScanHistoryCard: React.FC<ScanHistoryCardProps> = ({
  session,
  onView,
  onExport,
  onBookmark,
  onDelete,
  onArchive,
  isBookmarked = false,
  className
}) => {
  const medication = session.products || session.extractions?.extracted_json;
  const qualityScore = session.extractions?.quality_score || 0;
  const riskFlags = session.extractions?.risk_flags || [];
  const isUnknown = !medication?.brand_name || medication?.brand_name === "Unknown Medication";
  const hasHighRisk = riskFlags.length > 0;

  const getVariant = () => {
    if (hasHighRisk) return 'critical';
    if (isUnknown) return 'unknown';
    if (qualityScore >= 0.8) return 'success';
    return 'default';
  };

  const getStatusIcon = () => {
    if (hasHighRisk) return <AlertTriangle className="w-4 h-4 text-destructive" />;
    if (isUnknown) return <AlertTriangle className="w-4 h-4 text-warning" />;
    return <CheckCircle className="w-4 h-4 text-success" />;
  };

  const getStatusBadge = () => {
    if (hasHighRisk) return { variant: 'destructive', label: 'High Risk', icon: Shield };
    if (isUnknown) return { variant: 'warning', label: 'Unknown', icon: AlertTriangle };
    if (session.products) return { variant: 'success', label: 'Identified', icon: CheckCircle };
    return { variant: 'secondary', label: 'Scanned', icon: Pill };
  };

  const getQualityBadge = () => {
    if (qualityScore >= 0.8) return { variant: 'success', label: `${Math.round(qualityScore * 100)}%`, className: 'text-success border-success/30' };
    if (qualityScore >= 0.6) return { variant: 'warning', label: `${Math.round(qualityScore * 100)}%`, className: 'text-warning border-warning/30' };
    if (qualityScore > 0) return { variant: 'destructive', label: `${Math.round(qualityScore * 100)}%` };
    return null;
  };

  const statusBadge = getStatusBadge();
  const qualityBadge = getQualityBadge();

  return (
    <SwipeableCard
      variant={getVariant()}
      onBookmark={() => onBookmark?.(session.id)}
      onDelete={() => onDelete?.(session.id)}
      onArchive={() => onArchive?.(session.id)}
      className={className}
    >
      <MobileCardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Status and Type Indicators */}
            <div className="flex items-center gap-2 mb-3">
              {getStatusIcon()}
              <Badge 
                variant={statusBadge.variant as any} 
                className="text-xs font-medium flex items-center gap-1"
              >
                <statusBadge.icon className="w-3 h-3" />
                {statusBadge.label}
              </Badge>
              {session.barcode_value && (
                <Badge variant="outline" className="text-xs">
                  Barcode
                </Badge>
              )}
              {isBookmarked && (
                <Badge variant="outline" className="text-xs text-info border-info/30">
                  <Bookmark className="w-3 h-3 mr-1" />
                  Saved
                </Badge>
              )}
            </div>
            
            {/* Medication Name */}
            <MobileCardTitle className={cn(
              'text-base mb-1 line-clamp-2',
              isUnknown && 'text-warning-foreground',
              hasHighRisk && 'text-destructive-foreground'
            )}>
              {medication?.brand_name || "Unknown Medication"}
            </MobileCardTitle>
            
            {/* Medication Details */}
            {medication?.generic_name && (
              <MobileCardDescription className="text-sm mb-2 line-clamp-1">
                {medication.generic_name}
                {medication.strength && ` • ${medication.strength}`}
                {medication.form && ` • ${medication.form}`}
              </MobileCardDescription>
            )}
            
            {/* Timestamp */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{format(new Date(session.created_at), 'MMM d, yyyy h:mm a')}</span>
            </div>
          </div>
          
          {/* Quality and Risk Badges */}
          <div className="flex flex-col gap-1 items-end">
            {qualityBadge && (
              <Badge 
                variant="outline" 
                className={cn('text-xs font-medium', qualityBadge.className)}
              >
                <Star className="w-3 h-3 mr-1" />
                {qualityBadge.label}
              </Badge>
            )}
            {riskFlags.length > 0 && (
              <Badge variant="destructive" className="text-xs animate-pulse">
                {riskFlags.length} Risk{riskFlags.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </MobileCardHeader>
      
      <MobileCardContent>
        {/* Risk Flags Section */}
        {riskFlags.length > 0 && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <h4 className="text-sm font-medium text-destructive mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Safety Alerts:
            </h4>
            <ul className="text-sm text-destructive space-y-1">
              {riskFlags.slice(0, 2).map((flag, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  <span className="flex-1">{flag}</span>
                </li>
              ))}
              {riskFlags.length > 2 && (
                <li className="text-xs text-destructive/70 mt-2">
                  +{riskFlags.length - 2} more risk{riskFlags.length - 2 > 1 ? 's' : ''}
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Unknown Medication Help */}
        {isUnknown && (
          <div className="mb-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-warning-foreground mb-1">
                  Medication Not Identified
                </h4>
                <p className="text-xs text-muted-foreground">
                  Try scanning again with better lighting or add medication details manually.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <MobileButton 
            variant="ghost" 
            size="sm" 
            onClick={() => onView?.(session)}
            className="text-xs h-8"
          >
            View Details
          </MobileButton>
          {onExport && (
            <MobileButton 
              variant="ghost" 
              size="sm" 
              onClick={() => onExport(session)}
              className="text-xs h-8"
            >
              Export
            </MobileButton>
          )}
        </div>
      </MobileCardContent>
    </SwipeableCard>
  );
};

export default ScanHistoryCard;