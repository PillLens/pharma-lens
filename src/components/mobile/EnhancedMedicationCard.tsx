import React from 'react';
import { Calendar, User, Pill, Edit2, Trash2, MoreVertical, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

interface EnhancedMedicationCardProps {
  medication: UserMedication;
  onEdit: (medication: UserMedication) => void;
  onDelete: (id: string) => void;
  onToggleActive?: (id: string, isActive: boolean) => void;
  className?: string;
}

const EnhancedMedicationCard: React.FC<EnhancedMedicationCardProps> = ({
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

  const getFrequencyLabel = (frequency: string) => {
    const freq = frequency.toLowerCase();
    if (freq.includes('once')) return 'Once daily';
    if (freq.includes('twice')) return 'Twice daily';
    if (freq.includes('three')) return 'Three times daily';
    if (freq.includes('four')) return 'Four times daily';
    if (freq.includes('needed')) return 'As needed';
    return frequency;
  };

  const getFrequencyColor = (frequency: string) => {
    const freq = frequency.toLowerCase();
    if (freq.includes('once')) return 'bg-green-100 text-green-700 border-green-200';
    if (freq.includes('twice')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (freq.includes('three') || freq.includes('four')) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (freq.includes('needed')) return 'bg-purple-100 text-purple-700 border-purple-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
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

  return (
    <div className={cn(
      "bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 overflow-hidden",
      !medication.is_active && 'opacity-75',
      className
    )}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Pill className="w-5 h-5 text-white" />
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <Badge 
                  className={cn(
                    "text-xs font-semibold px-3 py-1 rounded-full border",
                    medication.is_active 
                      ? "bg-green-100 text-green-700 border-green-200" 
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  )}
                >
                  {medication.is_active ? 'Active' : 'Inactive'}
                </Badge>
                
                {isExpiringSoon() && (
                  <Badge className="text-xs font-semibold animate-pulse bg-amber-100 text-amber-700 border-amber-200 px-3 py-1 rounded-full border">
                    <Clock className="w-3 h-3 mr-1" />
                    Expiring Soon
                  </Badge>
                )}
                
                {isExpired() && (
                  <Badge className="text-xs font-semibold bg-red-100 text-red-700 border-red-200 px-3 py-1 rounded-full border">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Expired
                  </Badge>
                )}
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">
              {medication.medication_name}
            </h3>
            
            {medication.generic_name && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-1">
                Generic: {medication.generic_name}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-800 border shadow-lg z-50">
              <DropdownMenuItem 
                onClick={() => onEdit(medication)}
                className="gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </DropdownMenuItem>
              {onToggleActive && (
                <DropdownMenuItem 
                  onClick={() => onToggleActive(medication.id, !medication.is_active)}
                  className="gap-2"
                >
                  <Clock className="w-4 h-4" />
                  {medication.is_active ? 'Mark as Inactive' : 'Mark as Active'}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => onDelete(medication.id)}
                className="gap-2 text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Dosage and Frequency */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Dosage</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{medication.dosage}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Frequency</p>
            <Badge 
              className={cn('text-xs font-semibold px-3 py-1 rounded-full border', getFrequencyColor(medication.frequency))}
            >
              {getFrequencyLabel(medication.frequency)}
            </Badge>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex items-center gap-4 text-sm mb-4">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">Started:</span>
            <span className="text-slate-900 dark:text-white">{formatDate(medication.start_date)}</span>
          </div>
          
          {medication.end_date && (
            <>
              <div className="w-1 h-1 bg-slate-400 rounded-full" />
              <div className="flex items-center gap-2">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Until:</span>
                <span className={cn(
                  'font-medium',
                  isExpired() ? 'text-red-600' : isExpiringSoon() ? 'text-amber-600' : 'text-slate-900 dark:text-white'
                )}>
                  {formatDate(medication.end_date)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Prescriber */}
        {medication.prescriber && (
          <div className="flex items-center gap-2 text-sm mb-4">
            <User className="w-4 h-4 text-slate-500" />
            <span className="text-slate-600 dark:text-slate-400">Prescribed by:</span>
            <span className="font-medium text-slate-900 dark:text-white">{medication.prescriber}</span>
          </div>
        )}

        {/* Notes */}
        {medication.notes && (
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200/50 dark:border-slate-600/50">
            <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
              {medication.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedMedicationCard;