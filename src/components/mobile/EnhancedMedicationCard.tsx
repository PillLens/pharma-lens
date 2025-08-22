import React from 'react';
import { Calendar, User, Pill, Edit2, Trash2, MoreVertical, Clock, AlertTriangle, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
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
  onDelete: (medication: UserMedication) => void;
  onToggleActive?: (medication: UserMedication) => void;
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
    if (freq.includes('once')) return 'bg-green-500/10 text-green-700 border-green-200/30';
    if (freq.includes('twice')) return 'bg-blue-500/10 text-blue-700 border-blue-200/30';
    if (freq.includes('three') || freq.includes('four')) return 'bg-amber-500/10 text-amber-700 border-amber-200/30';
    if (freq.includes('needed')) return 'bg-purple-500/10 text-purple-700 border-purple-200/30';
    return 'bg-slate-500/10 text-slate-700 border-slate-200/30';
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
      "bg-white dark:bg-slate-900 rounded-2xl shadow-sm border-0 overflow-hidden",
      !medication.is_active && 'opacity-70',
      className
    )}>
      <div className="p-4">
        {/* Modern Header with iOS-style layout */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Pill className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-1 mb-0.5">
                {medication.medication_name}
              </h3>
              <div className="flex items-center gap-2">
                <Badge 
                  className={cn(
                    "text-xs font-medium px-2.5 py-1 rounded-full border-0",
                    medication.is_active 
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  )}
                >
                  {medication.is_active ? 'Active' : 'Paused'}
                </Badge>
                
                {isExpiringSoon() && (
                  <Badge className="text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-1 rounded-full border-0">
                    Expiring Soon
                  </Badge>
                )}
                
                {isExpired() && (
                  <Badge className="text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 px-2.5 py-1 rounded-full border-0">
                    Expired
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg rounded-xl p-1 z-50"
            >
              <DropdownMenuItem onClick={() => onEdit(medication)} className="gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                <Edit2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                Edit Medication
              </DropdownMenuItem>
              {onToggleActive && (
                <DropdownMenuItem onClick={() => onToggleActive(medication)} className="gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                  <Activity className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  {medication.is_active ? 'Pause' : 'Resume'}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDelete(medication)} className="gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400">
                <Trash2 className="w-4 h-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Native-style Info Sections */}
        <div className="space-y-3">
          {/* Dosage & Frequency Row */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Dosage
              </div>
              <div className="text-base font-semibold text-slate-900 dark:text-white">
                {medication.dosage}
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex-1">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Frequency
              </div>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {getFrequencyLabel(medication.frequency)}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">
                Started {formatDate(medication.start_date)}
              </span>
              {medication.end_date && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className={cn(
                    'font-medium',
                    isExpired() ? 'text-red-600 dark:text-red-400' : 
                    isExpiringSoon() ? 'text-amber-600 dark:text-amber-400' : 
                    'text-slate-600 dark:text-slate-400'
                  )}>
                    Until {formatDate(medication.end_date)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Doctor Info (if exists) */}
          {medication.prescriber && (
            <div className="flex items-center gap-2 pt-2 text-sm">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">
                Prescribed by Dr. {medication.prescriber}
              </span>
            </div>
          )}

          {/* Notes (if exists) - iOS style */}
          {medication.notes && (
            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Notes
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2">
                {medication.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedMedicationCard;