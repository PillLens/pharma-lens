import React, { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from '@/hooks/useTranslation';
import { useMedicationHistory } from '@/hooks/useMedicationHistory';
import { toast } from 'sonner';
import ProfessionalMobileLayout from '@/components/mobile/ProfessionalMobileLayout';
import PullToRefresh from '@/components/mobile/PullToRefresh';
import SwipeableCard from '@/components/mobile/SwipeableCard';
import MobileMedicationCard from '@/components/mobile/MobileMedicationCard';
import { MobileCard } from '@/components/ui/mobile/MobileCard';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import EmptyState from '@/components/medications/EmptyState';
import MedicationDetailsSheet from '@/components/medications/MedicationDetailsSheet';
import MedicationFormSheet from '@/components/medications/MedicationFormSheet';
import { UserMedication } from '@/hooks/useMedicationHistory';

const MedicationManager: React.FC = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { 
    medications, 
    loading, 
    addMedication, 
    updateMedication, 
    removeMedication,
    refetch 
  } = useMedicationHistory();

  // Modal states
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<UserMedication | null>(null);
  const [medicationToDelete, setMedicationToDelete] = useState<UserMedication | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refresh handler for pull-to-refresh
  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Medications refreshed');
    } catch (error) {
      toast.error('Failed to refresh medications');
    }
  };

  // Add medication handler
  const handleAddMedication = async (data: Partial<UserMedication>) => {
    setIsSubmitting(true);
    try {
      await addMedication(data as Omit<UserMedication, 'id' | 'created_at'>);
      toast.success(t('medications.medicationAdded'));
      setIsAddSheetOpen(false);
    } catch (error) {
      toast.error('Failed to add medication');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update medication handler
  const handleUpdateMedication = async (data: Partial<UserMedication>) => {
    if (!selectedMedication) return;
    
    setIsSubmitting(true);
    try {
      await updateMedication(selectedMedication.id, data);
      toast.success(t('medications.medicationUpdated'));
      setIsEditSheetOpen(false);
      setSelectedMedication(null);
    } catch (error) {
      toast.error('Failed to update medication');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete medication handler
  const handleDeleteMedication = async () => {
    if (!medicationToDelete) return;
    
    try {
      await removeMedication(medicationToDelete.id);
      toast.success(t('medications.medicationDeleted'));
      setMedicationToDelete(null);
    } catch (error) {
      toast.error('Failed to delete medication');
    }
  };

  // Card interaction handlers
  const handleCardTap = (medication: UserMedication) => {
    setSelectedMedication(medication);
    setIsDetailsSheetOpen(true);
  };

  const handleEditFromDetails = () => {
    setIsDetailsSheetOpen(false);
    setIsEditSheetOpen(true);
  };

  const handleEdit = (medication: UserMedication) => {
    setSelectedMedication(medication);
    setIsEditSheetOpen(true);
  };

  const handleDelete = (medication: UserMedication) => {
    setMedicationToDelete(medication);
  };

  const handleToggleActive = async (medication: UserMedication) => {
    try {
      await updateMedication(medication.id, { is_active: !medication.is_active });
      toast.success(`Medication ${medication.is_active ? 'paused' : 'activated'}`);
    } catch (error) {
      toast.error('Failed to update medication status');
    }
  };

  // Skeleton loading component
  const SkeletonCard = () => (
    <MobileCard className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </MobileCard>
  );

  // Desktop layout (simplified)
  if (!isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-primary/5 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('medications.title')}</h1>
              <p className="text-muted-foreground">{t('medications.subtitle')}</p>
            </div>
            <Button onClick={() => setIsAddSheetOpen(true)} className="rounded-2xl">
              <Plus className="w-4 h-4 mr-2" />
              {t('medications.add')}
            </Button>
          </div>

          {loading ? (
            <div className="grid gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : medications.length === 0 ? (
            <EmptyState onAddClick={() => setIsAddSheetOpen(true)} />
          ) : (
            <div className="grid gap-4">
              {medications.map((medication) => (
                <SwipeableCard
                  key={medication.id}
                  onDelete={() => handleDelete(medication)}
                >
                  <div onClick={() => handleCardTap(medication)} className="cursor-pointer">
                    <MobileMedicationCard
                      medication={medication}
                      onEdit={() => handleEdit(medication)}
                      onDelete={() => handleDelete(medication)}
                      onToggleActive={() => handleToggleActive(medication)}
                    />
                  </div>
                </SwipeableCard>
              ))}
            </div>
          )}
        </div>

        {/* Form and Detail Sheets */}
        <MedicationFormSheet
          isOpen={isAddSheetOpen}
          onClose={() => setIsAddSheetOpen(false)}
          onSave={handleAddMedication}
          isLoading={isSubmitting}
        />

        <MedicationFormSheet
          isOpen={isEditSheetOpen}
          onClose={() => setIsEditSheetOpen(false)}
          medication={selectedMedication}
          onSave={handleUpdateMedication}
          isLoading={isSubmitting}
        />

        <MedicationDetailsSheet
          isOpen={isDetailsSheetOpen}
          onClose={() => setIsDetailsSheetOpen(false)}
          medication={selectedMedication}
          onEdit={handleEditFromDetails}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={!!medicationToDelete} onOpenChange={() => setMedicationToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('medications.confirmDelete')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('medications.confirmDeleteText')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteMedication} className="bg-destructive text-destructive-foreground">
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Mobile layout
  return (
    <ProfessionalMobileLayout title={t('medications.title')}>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="px-4 py-6 space-y-6">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">
                {t('medications.subtitle')}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {medications.length} {medications.length === 1 ? 'medication' : 'medications'}
                </span>
              </div>
            </div>
            
            {/* Quick Add Button */}
            <Button
              onClick={() => setIsAddSheetOpen(true)}
              size="sm"
              className="rounded-2xl shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              {t('common.add')}
            </Button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : medications.length === 0 ? (
            <EmptyState onAddClick={() => setIsAddSheetOpen(true)} />
          ) : (
            <div className="space-y-3">
              {medications.map((medication) => (
                <SwipeableCard
                  key={medication.id}
                  onDelete={() => handleDelete(medication)}  
                  className="hover:shadow-md transition-shadow duration-200"
                >
                  <div onClick={() => handleCardTap(medication)}>
                    <MobileMedicationCard
                      medication={medication}
                      onEdit={() => handleEdit(medication)}
                      onDelete={() => handleDelete(medication)}
                      onToggleActive={() => handleToggleActive(medication)}
                    />
                  </div>
                </SwipeableCard>
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Bottom Sheets */}
      <MedicationFormSheet
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        onSave={handleAddMedication}
        isLoading={isSubmitting}
      />

      <MedicationFormSheet
        isOpen={isEditSheetOpen}
        onClose={() => setIsEditSheetOpen(false)}
        medication={selectedMedication}
        onSave={handleUpdateMedication}
        isLoading={isSubmitting}
      />

      <MedicationDetailsSheet
        isOpen={isDetailsSheetOpen}
        onClose={() => setIsDetailsSheetOpen(false)}
        medication={selectedMedication}
        onEdit={handleEditFromDetails}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!medicationToDelete} onOpenChange={() => setMedicationToDelete(null)}>
        <AlertDialogContent className="mx-4 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('medications.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('medications.confirmDeleteText')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteMedication} 
              className="bg-destructive text-destructive-foreground rounded-xl"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProfessionalMobileLayout>
  );
};

export default MedicationManager;