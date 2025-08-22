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
      "bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 dark:border-slate-700/30 overflow-hidden",
      !medication.is_active && 'opacity-60',
      className
    )}>
      <div className="p-6">
        {/* Header with Gradient Pill Icon */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Pill className="w-6 h-6 text-white" />
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <Badge 
                  className={cn(
                    "text-xs font-semibold px-3 py-1.5 rounded-full border backdrop-blur-sm",
                    medication.is_active 
                      ? "bg-green-500/10 text-green-700 border-green-200/30" 
                      : "bg-slate-500/10 text-slate-600 border-slate-200/30"
                  )}
                >
                  <Activity className="w-3 h-3 mr-1" />
                  {medication.is_active ? 'Active' : 'Inactive'}
                </Badge>
                
                {isExpiringSoon() && (
                  <Badge className="text-xs font-semibold animate-pulse bg-amber-500/10 text-amber-700 border-amber-200/30 px-3 py-1.5 rounded-full border backdrop-blur-sm">
                    <Clock className="w-3 h-3 mr-1" />
                    Expiring Soon
                  </Badge>
                )}
                
                {isExpired() && (
                  <Badge className="text-xs font-semibold bg-red-500/10 text-red-700 border-red-200/30 px-3 py-1.5 rounded-full border backdrop-blur-sm">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Expired
                  </Badge>
                )}
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-1">
              {medication.medication_name}
            </h3>
            
            {medication.generic_name && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-1">
                Generic: {medication.generic_name}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 h-10 w-10 rounded-xl hover:bg-white/50 dark:hover:bg-slate-700/50 backdrop-blur-sm border border-white/20 dark:border-slate-600/20"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 shadow-2xl rounded-2xl">
              <DropdownMenuItem 
                onClick={() => onEdit(medication)}
                className="gap-2 rounded-lg"
              >
                <Edit2 className="w-4 h-4" />
                Edit Medication
              </DropdownMenuItem>
              {onToggleActive && (
                <DropdownMenuItem 
                  onClick={() => onToggleActive(medication)}
                  className="gap-2 rounded-lg"
                >
                  <Activity className="w-4 h-4" />
                  {medication.is_active ? 'Mark as Inactive' : 'Mark as Active'}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => onDelete(medication)}
                className="gap-2 text-red-600 focus:text-red-600 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Dosage and Frequency with Glass Morphism */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm border border-white/20 dark:border-slate-600/20">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Dosage</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{medication.dosage}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm border border-white/20 dark:border-slate-600/20">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Frequency</p>
            <Badge 
              className={cn('text-xs font-semibold px-3 py-1.5 rounded-full border backdrop-blur-sm', getFrequencyColor(medication.frequency))}
            >
              {getFrequencyLabel(medication.frequency)}
            </Badge>
          </div>
        </div>

        {/* Timeline with Enhanced Design */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50/50 to-slate-100/50 dark:from-slate-700/30 dark:to-slate-800/30 backdrop-blur-sm border border-white/20 dark:border-slate-600/20 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">Started:</span>
              <span className="text-slate-900 dark:text-white font-semibold">{formatDate(medication.start_date)}</span>
            </div>
            
            {medication.end_date && (
              <div className="flex items-center gap-2">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Until:</span>
                <span className={cn(
                  'font-semibold',
                  isExpired() ? 'text-red-600' : isExpiringSoon() ? 'text-amber-600' : 'text-slate-900 dark:text-white'
                )}>
                  {formatDate(medication.end_date)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Prescriber Info */}
        {medication.prescriber && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/20 backdrop-blur-sm border border-blue-200/30 dark:border-blue-500/20 mb-4">
            <User className="w-5 h-5 text-blue-600" />
            <div>
              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Prescribed by:</span>
              <span className="ml-2 font-semibold text-blue-700 dark:text-blue-300">{medication.prescriber}</span>
            </div>
          </div>
        )}

        {/* Notes with Enhanced Styling */}
        {medication.notes && (
          <div className="p-4 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200/30 dark:border-amber-500/20 backdrop-blur-sm">
            <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed line-clamp-3">
              💡 {medication.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedMedicationCard;