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
      "bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-md border border-white/30 dark:border-slate-700/30 overflow-hidden max-w-sm mx-auto",
      !medication.is_active && 'opacity-60',
      className
    )}>
      <div className="p-4">
        {/* Compact Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <Pill className="w-5 h-5 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
              {medication.medication_name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  medication.is_active 
                    ? "bg-green-100 text-green-700" 
                    : "bg-slate-100 text-slate-600"
                )}
              >
                {medication.is_active ? 'Active' : 'Inactive'}
              </Badge>
              
              {isExpiringSoon() && (
                <Badge className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full animate-pulse">
                  <Clock className="w-3 h-3 mr-1" />
                  Expiring
                </Badge>
              )}
              
              {isExpired() && (
                <Badge className="text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Expired
                </Badge>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-1.5 h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex-shrink-0"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onEdit(medication)} className="gap-2 text-sm">
                <Edit2 className="w-4 h-4" />
                Edit
              </DropdownMenuItem>
              {onToggleActive && (
                <DropdownMenuItem onClick={() => onToggleActive(medication)} className="gap-2 text-sm">
                  <Activity className="w-4 h-4" />
                  {medication.is_active ? 'Pause' : 'Activate'}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDelete(medication)} className="gap-2 text-sm text-red-600">
                <Trash2 className="w-4 h-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Compact Info Grid */}
        <div className="space-y-3">
          {/* Dosage and Frequency Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50/70 dark:bg-slate-700/30 rounded-xl p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">DOSAGE</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{medication.dosage}</p>
            </div>
            <div className="bg-slate-50/70 dark:bg-slate-700/30 rounded-xl p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">FREQUENCY</p>
              <Badge className={cn('text-xs px-2 py-0.5 rounded-lg', getFrequencyColor(medication.frequency))}>
                {getFrequencyLabel(medication.frequency)}
              </Badge>
            </div>
          </div>

          {/* Timeline Row */}
          <div className="bg-slate-50/70 dark:bg-slate-700/30 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>Started: <span className="font-semibold text-slate-900 dark:text-white">{formatDate(medication.start_date)}</span></span>
              </div>
              {medication.end_date && (
                <div className="text-slate-600 dark:text-slate-400">
                  Until: <span className={cn('font-semibold', isExpired() ? 'text-red-600' : isExpiringSoon() ? 'text-amber-600' : 'text-slate-900 dark:text-white')}>
                    {formatDate(medication.end_date)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Prescriber (if exists) */}
          {medication.prescriber && (
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <User className="w-3.5 h-3.5" />
              <span>Dr. {medication.prescriber}</span>
            </div>
          )}

          {/* Notes (if exists) */}
          {medication.notes && (
            <div className="bg-amber-50/70 dark:bg-amber-900/20 rounded-xl p-3">
              <p className="text-xs text-amber-800 dark:text-amber-200 line-clamp-2">
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