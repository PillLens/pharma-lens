import React from 'react';
import { 
  Pill, 
  Clock, 
  Calendar, 
  FileText, 
  Bell, 
  History,
  Edit3,
  ChevronRight
} from 'lucide-react';
import BottomSheet from '@/components/ui/mobile/BottomSheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';
import { UserMedication } from '@/hooks/useMedicationHistory';

interface MedicationDetailsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  medication: UserMedication | null;
  onEdit: () => void;
}

const MedicationDetailsSheet: React.FC<MedicationDetailsSheetProps> = ({
  isOpen,
  onClose,
  medication,
  onEdit
}) => {
  const { t } = useTranslation();

  if (!medication) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success border-success/20';
      case 'inactive':
        return 'bg-muted text-muted-foreground border-border';
      case 'completed':
        return 'bg-info/10 text-info border-info/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const detailSections = [
    {
      id: 'dosage',
      title: t('medications.details.dosageSchedule'),
      icon: Pill,
      items: [
        { label: t('medications.dosage'), value: medication.dosage },
        { label: t('medications.frequency'), value: medication.frequency },
        { label: t('medications.form'), value: 'Tablet' } // Default form since not in interface
      ]
    },
    {
      id: 'dates',
      title: t('medications.details.refillNotes'),
      icon: Calendar,
      items: [
        { label: t('medications.startDate'), value: formatDate(medication.start_date) },
        { label: t('medications.endDate'), value: medication.end_date ? formatDate(medication.end_date) : 'Ongoing' },
        { label: t('medications.prescriber'), value: medication.prescriber || 'Not specified' }
      ]
    }
  ];

  return (
    <BottomSheet 
      isOpen={isOpen} 
      onClose={onClose}
      height="lg"
      title={medication.medication_name}
      subtitle={medication.generic_name}
    >
      <div className="p-6 space-y-6">
        {/* Status and Key Info */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge className={getStatusColor(medication.is_active ? 'active' : 'inactive')}>
              {t(`medications.status.${medication.is_active ? 'active' : 'inactive'}`)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {medication.generic_name || 'No strength info'}
            </span>
          </div>
        </div>

        {/* Detail Sections */}
        <div className="space-y-4">
          {detailSections.map((section) => (
            <div key={section.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <section.icon className="w-5 h-5 text-primary" />
                <h3 className="font-medium text-foreground">{section.title}</h3>
              </div>
              
              <div className="space-y-2 pl-7">
                {section.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-medium text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Primary Edit Action */}
        <div className="pt-4">
          <Button
            onClick={onEdit}
            className="w-full rounded-2xl"
            size="lg"
          >
            <Edit3 className="w-5 h-5 mr-2" />
            {t('common.edit')} {t('medications.title')}
          </Button>
        </div>

        {/* Notes Section */}
        {medication.notes && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="font-medium text-foreground">{t('medications.notes')}</h3>
            </div>
            <div className="pl-7">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {medication.notes}
              </p>
            </div>
          </div>
        )}

        {/* Action Sections - Future Features */}
        <div className="space-y-2 pt-4 border-t border-border">
          <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-accent transition-colors">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">{t('medications.details.reminders')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          
          <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-accent transition-colors">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">{t('medications.details.history')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

export default MedicationDetailsSheet;