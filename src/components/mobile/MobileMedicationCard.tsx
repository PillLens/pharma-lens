import React from 'react';
import { Calendar, User, Pill, Edit2, Trash2, MoreVertical, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle, MobileCardDescription } from '@/components/ui/mobile/MobileCard';
import { MobileButton } from '@/components/ui/mobile/MobileButton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { TranslatedText } from '@/components/TranslatedText';
import { format } from 'date-fns';

interface UserMedication {
  id: string;
  medication_name: string;
  generic_name?: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  prescriber?: string;
  notes?: string;
  is_active: boolean;
}

interface MobileMedicationCardProps {
  medication: UserMedication;
  onEdit: (medication: UserMedication) => void;
  onDelete: (id: string) => void;
  onToggleActive?: (id: string, isActive: boolean) => void;
  className?: string;
}

const MobileMedicationCard: React.FC<MobileMedicationCardProps> = ({
  medication,
  onEdit,
  onDelete,
  onToggleActive,
  className
}) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const getFrequencyColor = (frequency: string) => {
    const freq = frequency.toLowerCase();
    if (freq.includes('once')) return 'bg-green-500/10 text-green-600 border-green-500/20';
    if (freq.includes('twice')) return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    if (freq.includes('three') || freq.includes('four')) return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    if (freq.includes('needed')) return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
  };

  const isExpiringSoon = () => {
    if (!medication.end_date) return false;
    const endDate = new Date(medication.end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const isExpired = () => {
    if (!medication.end_date) return false;
    const endDate = new Date(medication.end_date);
    const today = new Date();
    return endDate < today;
  };

  const getCardVariant = () => {
    if (!medication.is_active) return 'outline';
    if (isExpired()) return 'critical';
    if (isExpiringSoon()) return 'warning';
    return 'medical';
  };

  return (
    <MobileCard 
      variant={getCardVariant() as any}
      className={cn(
        'transition-all duration-200 hover:shadow-card',
        !medication.is_active && 'opacity-75',
        className
      )}
    >
      <MobileCardHeader className="pb-1">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-gradient-medical flex items-center justify-center shadow-soft">
                <Pill className="w-3.5 h-3.5 text-white" />
              </div>
              <Badge 
                variant={medication.is_active ? 'default' : 'secondary'}
                className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  medication.is_active 
                    ? "bg-green-500/10 text-green-600 border-green-500/20" 
                    : "bg-slate-500/10 text-slate-600 border-slate-500/20"
                )}
              >
                {medication.is_active ? (
                  <TranslatedText translationKey="medications.status.active" fallback="Active" />
                ) : (
                  <TranslatedText translationKey="medications.status.inactive" fallback="Inactive" />
                )}
              </Badge>
              {isExpiringSoon() && (
                <Badge className="text-xs font-medium animate-pulse bg-amber-500/10 text-amber-600 border-amber-500/20 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3 mr-0.5" />
                  <TranslatedText translationKey="medications.status.expiring" fallback="Expiring Soon" />
                </Badge>
              )}
              {isExpired() && (
                <Badge className="text-xs font-medium bg-red-500/10 text-red-600 border-red-500/20 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="w-3 h-3 mr-0.5" />
                  <TranslatedText translationKey="medications.status.expired" fallback="Expired" />
                </Badge>
              )}
            </div>

            <MobileCardTitle className="text-sm mb-0.5 line-clamp-1">
              {medication.medication_name}
            </MobileCardTitle>
            
            {medication.generic_name && (
              <MobileCardDescription className="text-xs mb-1 line-clamp-1">
                ({medication.generic_name})
              </MobileCardDescription>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">{medication.dosage}</span>
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              <Badge 
                variant="outline" 
                className={cn('text-xs border px-2 py-0.5 rounded-full', getFrequencyColor(medication.frequency))}
              >
                {medication.frequency}
              </Badge>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <MobileButton
                variant="ghost"
                size="sm"
                className="p-1.5 h-6 w-6"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </MobileButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-background border shadow-lg z-50">
              <DropdownMenuItem 
                onClick={() => onEdit(medication)}
                className="gap-2"
              >
                <Edit2 className="w-4 h-4" />
                <TranslatedText translationKey="common.edit" fallback="Edit" />
              </DropdownMenuItem>
              {onToggleActive && (
                <DropdownMenuItem 
                  onClick={() => onToggleActive(medication.id, !medication.is_active)}
                  className="gap-2"
                >
                  <Clock className="w-4 h-4" />
                  {medication.is_active ? (
                    <TranslatedText translationKey="medication.markInactive" fallback="Mark as Inactive" />
                  ) : (
                    <TranslatedText translationKey="medication.markActive" fallback="Mark as Active" />
                  )}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => onDelete(medication.id)}
                className="gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                <TranslatedText translationKey="common.delete" fallback="Delete" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </MobileCardHeader>

      <MobileCardContent>
        <div className="space-y-2">
          {/* Timeline */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span className="text-xs">
                <TranslatedText translationKey="medication.started" fallback="Started" />
              </span>
            </div>
            <span className="font-medium text-foreground">
              {formatDate(medication.start_date)}
            </span>
            
            {medication.end_date && (
              <>
                <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                <span className="text-xs text-muted-foreground">
                  <TranslatedText translationKey="medication.until" fallback="until" />
                </span>
                <span className={cn(
                  'font-medium',
                  isExpired() ? 'text-destructive' : isExpiringSoon() ? 'text-warning' : 'text-foreground'
                )}>
                  {formatDate(medication.end_date)}
                </span>
              </>
            )}
          </div>

          {/* Prescriber */}
          {medication.prescriber && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                <TranslatedText translationKey="medication.prescriber" fallback="Prescriber" />:
              </span>
              <span className="font-medium text-foreground">
                {medication.prescriber}
              </span>
            </div>
          )}

          {/* Notes */}
          {medication.notes && (
            <div className="p-2 bg-muted/30 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground line-clamp-2">
                {medication.notes}
              </p>
            </div>
          )}
        </div>
      </MobileCardContent>
    </MobileCard>
  );
};

export default MobileMedicationCard;